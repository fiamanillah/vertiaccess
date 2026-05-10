"use client"

import * as React from "react"
import { Upload, X, FileIcon, CheckCircle2 } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Progress } from "@workspace/ui/components/progress"
import { cn } from "@workspace/ui/lib/utils"

export interface FileUploadProps {
  onFilesChange?: (files: File[]) => void
  maxSize?: number // in MB
  accept?: string
  className?: string
}

interface UploadingFile {
  id: string
  file: File
  progress: number
  status: 'uploading' | 'completed' | 'error'
}

export function FileUploader({ 
  onFilesChange, 
  maxSize = 10, 
  accept = "*", 
  className 
}: FileUploadProps) {
  const [files, setFiles] = React.useState<UploadingFile[]>([])
  const [isDragging, setIsDragging] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleFiles = (newFiles: FileList | File[]) => {
    const validFiles = Array.from(newFiles).filter(file => {
      if (file.size > maxSize * 1024 * 1024) {
        alert(`File ${file.name} is too large. Max size is ${maxSize}MB.`)
        return false
      }
      return true
    })

    const newUploadingFiles = validFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      progress: 0,
      status: 'uploading' as const
    }))

    setFiles(prev => [...prev, ...newUploadingFiles])

    // Simulate upload for each file
    newUploadingFiles.forEach(uploadingFile => {
      simulateUpload(uploadingFile.id)
    })

    if (onFilesChange) {
      onFilesChange([...files.map(f => f.file), ...validFiles])
    }
  }

  const simulateUpload = (id: string) => {
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 30
      if (progress >= 100) {
        progress = 100
        clearInterval(interval)
        setFiles(prev => prev.map(f => f.id === id ? { ...f, progress, status: 'completed' } : f))
      } else {
        setFiles(prev => prev.map(f => f.id === id ? { ...f, progress } : f))
      }
    }, 400)
  }

  const removeFile = (id: string) => {
    const updatedFiles = files.filter(f => f.id !== id)
    setFiles(updatedFiles)
    if (onFilesChange) {
      onFilesChange(updatedFiles.map(f => f.file))
    }
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const onDragLeave = () => {
    setIsDragging(false)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const truncateFileName = (name: string, maxLength: number = 30) => {
    if (name.length <= maxLength) return name
    const lastDotIndex = name.lastIndexOf(".")
    if (lastDotIndex <= 0) return name.slice(0, maxLength - 3) + "..."
    
    const extension = name.slice(lastDotIndex)
    const baseName = name.slice(0, lastDotIndex)
    
    const availableLength = maxLength - extension.length - 3
    if (availableLength <= 0) return baseName.slice(0, 5) + "..." + extension
    
    return baseName.slice(0, availableLength) + "..." + extension
  }

  return (
    <div className={cn("w-full space-y-6", className)}>
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-10 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-4 bg-muted/30 hover:bg-muted/50 group",
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
            "size-12 rounded-full bg-primary/10 flex items-center justify-center transition-all duration-300",
            isDragging ? "scale-110 bg-primary/20" : "group-hover:scale-105"
        )}>
          <Upload className={cn("size-6 text-primary transition-transform duration-300", isDragging && "animate-bounce")} />
        </div>
        
        <div className="text-center space-y-1">
          <p className="font-semibold text-lg tracking-tight">Click to upload or drag and drop</p>
          <p className="text-sm text-muted-foreground">
            Support for PDF, JPG, PNG (Max {maxSize}MB)
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Uploaded Files</p>
            <p className="text-xs text-muted-foreground">{files.length} {files.length === 1 ? 'file' : 'files'}</p>
          </div>
          <div className="grid gap-3">
            {files.map((file) => (
              <div 
                key={file.id} 
                className="group relative flex items-center gap-4 p-4 rounded-xl border bg-card hover:border-primary/40 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <div className="size-10 rounded-lg bg-primary/5 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                  <FileIcon className="size-5 text-primary/70" />
                </div>
                
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold truncate min-w-0 flex-1">{truncateFileName(file.file.name)}</p>
                    <span className="text-[10px] font-medium text-muted-foreground tabular-nums shrink-0">
                      {(file.file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                  
                  {file.status === 'uploading' ? (
                    <div className="flex items-center gap-3">
                      <Progress value={file.progress} className="h-1.5 flex-1" />
                      <span className="text-[10px] font-bold text-primary tabular-nums w-8 text-right">
                        {Math.round(file.progress)}%
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-bold animate-in zoom-in-95 duration-300">
                      <CheckCircle2 className="size-3.5" />
                      <span>Ready to save</span>
                    </div>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-full hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all duration-200"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFile(file.id)
                  }}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
