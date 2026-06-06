'use client'

import * as React from 'react'
import { Shield, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'
import { FileUploader } from '@/components/file-uploader'
import { toast } from 'sonner'
import { cn } from '@workspace/ui/lib/utils'
import { DocTypeSelector } from './doc-type-selector'
import { VerificationPending } from './verification-pending'
import { Plus, Check, FileIcon } from 'lucide-react'

import { authService } from '@/services/auth/auth.service'
import { type UploadedFileMetadata } from '@/services/media.service'
import { useAuthStore } from '@/store/use-auth-store'

type VerificationDocType = 'national_id' | 'passport' | 'pilot_license' | 'insurance'

export function VerificationCard() {
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)

  const [selectedIdentityType, setSelectedIdentityType] = React.useState<
    'national_id' | 'passport'
  >('national_id')
  
  const [uploads, setUploads] = React.useState<Record<string, UploadedFileMetadata>>({})
  const [activeUploadSection, setActiveUploadSection] = React.useState<VerificationDocType | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const verificationStatus = React.useMemo(() => {
    if (isSubmitting) return 'submitting'
    if (user?.hasPendingVerification || user?.verificationStatus === 'PENDING')
      return 'pending'
    if (user?.verified || user?.verificationStatus === 'VERIFIED' || user?.verificationStatus === 'APPROVED')
      return 'verified'
    if (user?.verificationStatus === 'REJECTED') return 'rejected'
    return 'idle'
  }, [user, isSubmitting])

  const requiredDocs = React.useMemo(() => {
    const docs = [{ id: 'identity', label: 'Identity Document', description: 'National ID or Passport' }]
    const userRole = user?.role?.toLowerCase()
    if (userRole === 'operator') {
      docs.push({ id: 'pilot_license', label: 'CAA Pilot License', description: 'Drone operational permission' })
    }
    return docs
  }, [user?.role])

  const isReadyToSubmit = React.useMemo(() => {
    // Need identity document (either NID or Passport)
    const hasIdentity = uploads['national_id'] || uploads['passport']
    if (!hasIdentity) return false
    
    // If operator, also need pilot license
    const userRole = user?.role?.toLowerCase()
    if (userRole === 'operator') {
      return !!uploads['pilot_license']
    }
    
    return true
  }, [uploads, user?.role])

  const handleUploadComplete = (type: VerificationDocType, metadata: UploadedFileMetadata[]) => {
    if (metadata.length > 0) {
      setUploads(prev => ({ ...prev, [type]: metadata[0]! }))
      setActiveUploadSection(null)
    }
  }

  const handleSubmit = async () => {
    if (!isReadyToSubmit) return

    setIsSubmitting(true)
    try {
      const userRole = user?.role?.toLowerCase()
      
      if (userRole === 'operator') {
        const identityType = uploads['national_id'] ? 'national_id' : 'passport'
        const identityFile = uploads[identityType]!
        const licenseFile = uploads['pilot_license']!

        await authService.submitOperatorVerification({
          identityDocument: {
            documentType: identityType,
            fileKey: identityFile.fileKey,
          },
          supportingDocuments: [
            {
              fileKey: licenseFile.fileKey,
              fileName: licenseFile.fileName,
            },
          ],
        })
      } else {
        // AssetManager flow
        const identityType = uploads['national_id'] ? 'national_id' : 'passport'
        const identityFile = uploads[identityType]!

        await authService.submitIdentityVerification({
          documentType: identityType,
          fileKey: identityFile.fileKey,
        })
      }

      const response = await authService.getCurrentUser()
      if (response.success && response.data) {
        setUser(response.data)
      }

      toast.success('Verification package submitted successfully')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to submit verification'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card
      className={cn(
        'transition-all duration-500 overflow-hidden',
        verificationStatus === 'pending'
          ? 'border-primary/50 bg-primary/5 shadow-lg shadow-primary/5'
          : '',
      )}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield
              className={cn(
                'h-5 w-5 transition-colors',
                verificationStatus === 'pending'
                  ? 'text-primary'
                  : verificationStatus === 'verified'
                  ? 'text-primary'
                  : 'text-muted-foreground',
              )}
            />
            <CardTitle>Account Verification</CardTitle>
          </div>
          {verificationStatus === 'verified' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold animate-in fade-in zoom-in duration-500">
              <CheckCircle2 className="size-3" />
              Verified
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="grid gap-6">
        {verificationStatus === 'pending' ? (
          <VerificationPending docType="identity" />
        ) : verificationStatus === 'verified' ? (
          <div className="flex flex-col items-center justify-center py-6 text-center animate-in fade-in zoom-in duration-700">
            <div className="mb-4 rounded-full bg-primary/10 p-5 dark:bg-primary/5 ring-8 ring-primary/5">
              <Shield className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground">
              Verification Complete
            </h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-[280px]">
              {user?.role?.toLowerCase() === 'operator'
                ? 'Your identity and pilot license are verified. You have full operational access.'
                : 'Your identity has been verified. You now have full access to all assetmanager features.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {verificationStatus === 'rejected' && (
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium mb-4 space-y-1">
                <p className="font-bold">Verification was rejected</p>
                <p className="text-xs opacity-90">Reason: {user?.rejectionReason || 'Please re-upload your documents.'}</p>
              </div>
            )}

            <div className="grid gap-3">
              {requiredDocs.map((doc) => {
                const actualDocType = doc.id === 'identity' ? selectedIdentityType : doc.id as VerificationDocType
                const isUploaded = !!uploads[actualDocType]
                const isActive = activeUploadSection === doc.id

                return (
                  <div key={doc.id} className="space-y-3">
                    <div 
                      className={cn(
                        "flex items-center justify-between p-4 rounded-xl border transition-all duration-300",
                        isUploaded ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-transparent",
                        isActive && "border-primary bg-primary/5 ring-1 ring-primary/20"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "size-10 rounded-full flex items-center justify-center transition-colors",
                          isUploaded ? "bg-primary/10 text-primary" : "bg-background text-muted-foreground"
                        )}>
                          {isUploaded ? <Check className="size-5" /> : <FileIcon className="size-5" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold">{doc.label}</p>
                          <p className="text-[11px] text-muted-foreground">{doc.description}</p>
                        </div>
                      </div>
                      
                      {!isUploaded ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 gap-1.5 font-bold"
                          onClick={() => setActiveUploadSection(isActive ? null : doc.id as VerificationDocType)}
                        >
                          <Plus className="size-3.5" />
                          Upload
                        </Button>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 text-[11px] font-bold text-primary hover:text-primary hover:bg-primary/10"
                          onClick={() => setActiveUploadSection(doc.id as VerificationDocType)}
                        >
                          Replace
                        </Button>
                      )}
                    </div>

                    {isActive && (
                      <div className="p-4 rounded-xl border bg-background space-y-4 animate-in slide-in-from-top-2 duration-300">
                        {doc.id === 'identity' && (
                          <div className="space-y-3">
                            <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Select Identity Type</p>
                            <DocTypeSelector selected={selectedIdentityType} onSelect={setSelectedIdentityType} />
                          </div>
                        )}
                        <FileUploader
                          accept=".pdf,.jpg,.jpeg,.png"
                          maxSize={10}
                          category="IDENTITY_VERIFICATION"
                          onUploadComplete={(meta) => handleUploadComplete(actualDocType, meta)}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
      {(verificationStatus === 'idle' ||
        verificationStatus === 'rejected' ||
        verificationStatus === 'submitting') &&
        isReadyToSubmit && (
          <CardFooter className="pt-2">
            <Button
              className="w-full h-11 font-bold text-sm transition-all duration-300 shadow-lg shadow-primary/20"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Verification...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Submit All Documents
                </>
              )}
            </Button>
          </CardFooter>
        )}
    </Card>
  )
}
