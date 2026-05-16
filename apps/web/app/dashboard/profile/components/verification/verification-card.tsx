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

import { authService } from '@/services/auth/auth.service'
import { type UploadedFileMetadata } from '@/services/media.service'
import { useAuthStore } from '@/store/use-auth-store'

export function VerificationCard() {
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)

  const [selectedDocType, setSelectedDocType] = React.useState<
    'national_id' | 'passport'
  >('national_id')
  const [uploadedFiles, setUploadedFiles] = React.useState<
    UploadedFileMetadata[]
  >([])
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Sync local status with user profile status
  const verificationStatus = React.useMemo(() => {
    if (isSubmitting) return 'submitting'
    if (user?.hasPendingVerification || user?.verificationStatus === 'PENDING')
      return 'pending'
    if (user?.verified || user?.verificationStatus === 'VERIFIED')
      return 'verified'
    if (user?.verificationStatus === 'REJECTED') return 'rejected'
    return 'idle'
  }, [user, isSubmitting])

  const handleSubmit = async () => {
    if (uploadedFiles.length === 0) return

    setIsSubmitting(true)
    try {
      await authService.submitIdentityVerification({
        documentType: selectedDocType,
        fileKey: uploadedFiles[0]!.fileKey,
      })

      // Refresh user data to reflect pending status
      const response = await authService.getCurrentUser()
      if (response.success && response.data) {
        setUser(response.data)
      }

      toast.success('Verification submitted successfully')
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
        'transition-all duration-500',
        verificationStatus === 'pending'
          ? 'border-primary/50 bg-primary/5 shadow-lg shadow-primary/5'
          : '',
      )}
    >
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield
            className={cn(
              'h-5 w-5 transition-colors',
              verificationStatus === 'pending'
                ? 'text-primary'
                : 'text-muted-foreground',
            )}
          />
          <CardTitle>Identity Verification</CardTitle>
        </div>
        <CardDescription>
          Verify your identity to unlock all features
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {verificationStatus === 'pending' ? (
          <VerificationPending docType={selectedDocType} />
        ) : verificationStatus === 'verified' ? (
          <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in zoom-in duration-500">
            <div className="mb-4 rounded-full bg-emerald-50 p-4 dark:bg-emerald-950/20">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-foreground">
              Identity Verified
            </h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-[250px]">
              Your identity has been successfully verified. You now have full
              access to the platform.
            </p>
          </div>
        ) : verificationStatus === 'rejected' ? (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
              Verification was rejected. Please review your documents and try
              again.
            </div>
            <DocTypeSelector
              selected={selectedDocType}
              onSelect={setSelectedDocType}
            />
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <FileUploader
                accept=".pdf,.jpg,.jpeg,.png"
                maxSize={10}
                category="IDENTITY_VERIFICATION"
                onUploadComplete={setUploadedFiles}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <DocTypeSelector
              selected={selectedDocType}
              onSelect={setSelectedDocType}
            />
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <FileUploader
                accept=".pdf,.jpg,.jpeg,.png"
                maxSize={10}
                category="IDENTITY_VERIFICATION"
                onUploadComplete={setUploadedFiles}
              />
            </div>
          </div>
        )}
      </CardContent>
      {(verificationStatus === 'idle' ||
        verificationStatus === 'rejected' ||
        verificationStatus === 'submitting') &&
        uploadedFiles.length > 0 && (
          <CardFooter className="pt-2">
            <Button
              className="w-full h-11 font-bold text-sm transition-all duration-300 shadow-lg shadow-primary/20"
              onClick={handleSubmit}
              disabled={verificationStatus === 'submitting'}
            >
              {verificationStatus === 'submitting' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Documents...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Submit for Verification
                </>
              )}
            </Button>
          </CardFooter>
        )}
    </Card>
  )
}
