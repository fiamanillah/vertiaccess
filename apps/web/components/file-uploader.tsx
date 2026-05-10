"use client"

import * as React from "react"
import { Upload, X, FileIcon, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Progress } from "@workspace/ui/components/progress"
import { cn } from "@workspace/ui/lib/utils"

export interface FileUploadProps {
  onFilesChange?: (files: File[]) => void
  /** Called with the resolved public URL for each successfully uploaded file */
  onUploadComplete?: (urls: string[]) => void
  maxSize?: number // in MB
  accept?: string
  className?: string
}

interface UploadingFile {
  id: string
  file: File
  progress: number
  status: 'uploading' | 'completed' | 'error'
  url?: string
  errorMessage?: string
}

/** Simulates a real upload API call — resolves with a mock CDN URL */
async function mockUploadApi(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    let progress = 0
    // We resolve after fully simulated upload (caller drives progress separately)
    const delay = 800 + Math.random() * 600
    setTimeout(() => {
      // ~5% chance of a simulated error
      if (Math.random() < 0.05) {
        reject(new Error("Upload failed. Please try again."))
      } else {
        const safeName = encodeURIComponent(file.name.replace(/\s+/g, '-'))
        resolve(`https://cdn.vertiaccess.com/sites/photos/${Date.now()}-${safeName}`)
      }
    }, delay)
  })
}

export function FileUploader({
  onFilesChange,
  onUploadComplete,
  maxSize = 10,
  accept = "*",
  className
}: FileUploadProps) {
  const [files, setFiles] = React.useState<UploadingFile[]>([])
  const [isDragging, setIsDragging] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Keep a ref of the latest uploaded URLs so we can fire onUploadComplete
  const uploadedUrlsRef = React.useRef<Record<string, string>>({})

  const handleFiles = (newFiles: FileList | File[]) => {
    const validFiles = Array.from(newFiles).filter(file => {
      if (file.size > maxSize * 1024 * 1024) {
        alert(`File "${file.name}" is too large. Max size is ${maxSize} MB.`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    const newUploadingFiles: UploadingFile[] = validFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      progress: 0,
      status: 'uploading' as const,
    }))

    setFiles(prev => [...prev, ...newUploadingFiles])

    if (onFilesChange) {
      onFilesChange([...files.map(f => f.file), ...validFiles])
    }

    // Start upload for each file
    newUploadingFiles.forEach(uploadingFile => {
      simulateProgress(uploadingFile.id)
      mockUploadApi(uploadingFile.file)
        .then(url => {
          uploadedUrlsRef.current[uploadingFile.id] = url
          setFiles(prev => {
            const updated = prev.map(f =>
              f.id === uploadingFile.id
                ? { ...f, progress: 100, status: 'completed' as const, url }
                : f
            )
            // Notify parent with all completed URLs
            const completedUrls = updated
              .filter(f => f.status === 'completed' && f.url)
              .map(f => f.url!)
            onUploadComplete?.(completedUrls)
            return updated
          })
        })
        .catch(err => {
          setFiles(prev =>
            prev.map(f =>
              f.id === uploadingFile.id
                ? { ...f, status: 'error' as const, errorMessage: err.message }
                : f
            )
          )
        })
    })
  }

  /** Independently animate progress bar while API call is in-flight */
  const simulateProgress = (id: string) => {
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 25
      if (progress >= 90) {
        // Stop at 90% — the API call completion will set 100%
        clearInterval(interval)
        setFiles(prev => prev.map(f => (f.id === id && f.status === 'uploading' ? { ...f, progress: 90 } : f)))
      } else {
        setFiles(prev => prev.map(f => (f.id === id && f.status === 'uploading' ? { ...f, progress } : f)))
      }
    }, 350)
  }

  const removeFile = (id: string) => {
    delete uploadedUrlsRef.current[id]
    setFiles(prev => {
      const updated = prev.filter(f => f.id !== id)
      if (onFilesChange) onFilesChange(updated.map(f => f.file))
      const completedUrls = updated
        .filter(f => f.status === 'completed' && f.url)
        .map(f => f.url!)
      onUploadComplete?.(completedUrls)
      return updated
    })
  }

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const onDragLeave = () => setIsDragging(false)
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files)
  }

  const truncateFileName = (name: string, maxLength = 32) => {
    if (name.length <= maxLength) return name
    const lastDot = name.lastIndexOf(".")
    if (lastDot <= 0) return name.slice(0, maxLength - 3) + "..."
    const ext = name.slice(lastDot)
    const base = name.slice(0, lastDot)
    const avail = maxLength - ext.length - 3
    return avail <= 0 ? base.slice(0, 5) + "..." + ext : base.slice(0, avail) + "..." + ext
  }

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Drop zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-3 bg-muted/30 hover:bg-muted/50 group",
          isDragging ? "border-primary bg-primary/5 scale-[0.99]" : "border-muted-foreground/20"
        )}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          multiple
          accept={accept}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />

        <div className={cn(
          "size-11 rounded-full bg-primary/10 flex items-center justify-center transition-all duration-300",
          isDragging ? "scale-110 bg-primary/20" : "group-hover:scale-105"
        )}>
          <Upload className={cn("size-5 text-primary transition-transform duration-300", isDragging && "animate-bounce")} />
        </div>

        <div className="text-center space-y-1">
          <p className="font-semibold text-sm">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-muted-foreground">
            JPG, PNG, WEBP — max {maxSize} MB per file
          </p>
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-300">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              {files.length} {files.length === 1 ? 'photo' : 'photos'}
            </p>
            <p className="text-xs text-muted-foreground">
              {files.filter(f => f.status === 'completed').length} ready
            </p>
          </div>

          <div className="grid gap-2">
            {files.map((file) => (
              <div
                key={file.id}
                className={cn(
                  "group relative flex items-center gap-3 p-3 rounded-lg border bg-card transition-all duration-200",
                  file.status === 'error'
                    ? "border-destructive/40 bg-destructive/5"
                    : "hover:border-primary/40 shadow-sm"
                )}
              >
                <div className={cn(
                  "size-9 rounded-md flex items-center justify-center shrink-0 transition-colors",
                  file.status === 'error'
                    ? "bg-destructive/10"
                    : "bg-primary/5 group-hover:bg-primary/10"
                )}>
                  {file.status === 'error'
                    ? <AlertCircle className="size-4 text-destructive" />
                    : <FileIcon className="size-4 text-primary/70" />
                  }
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold truncate min-w-0 flex-1">
                      {truncateFileName(file.file.name)}
                    </p>
                    <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                      {(file.file.size / 1024 / 1024).toFixed(1)} MB
                    </span>
                  </div>

                  {file.status === 'uploading' && (
                    <div className="flex items-center gap-2">
                      <Progress value={file.progress} className="h-1 flex-1" />
                      <span className="text-[10px] font-bold text-primary tabular-nums w-7 text-right">
                        {Math.round(file.progress)}%
                      </span>
                    </div>
                  )}

                  {file.status === 'completed' && (
                    <div className="flex items-center gap-1 text-[11px] text-emerald-500 font-semibold animate-in zoom-in-95 duration-200">
                      <CheckCircle2 className="size-3" />
                      <span className="truncate">{file.url}</span>
                    </div>
                  )}

                  {file.status === 'error' && (
                    <p className="text-[11px] text-destructive font-medium">{file.errorMessage}</p>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 rounded-full hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all duration-200 shrink-0"
                  onClick={(e) => { e.stopPropagation(); removeFile(file.id) }}
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
