'use client'

import * as React from 'react'
import { Shield, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { FileUploader } from "@/components/file-uploader"
import { toast } from "sonner"
import { cn } from "@workspace/ui/lib/utils"
import { DocTypeSelector } from "./doc-type-selector"
import { VerificationPending } from "./verification-pending"

import { authService } from "@/services/auth/auth.service"
import { type UploadedFileMetadata } from "@/services/media.service"

export function VerificationCard() {
    const [selectedDocType, setSelectedDocType] = React.useState<'national_id' | 'passport'>('national_id')
    const [uploadedFiles, setUploadedFiles] = React.useState<UploadedFileMetadata[]>([])
    const [verificationStatus, setVerificationStatus] = React.useState<'idle' | 'submitting' | 'pending'>('idle')

    const handleSubmit = async () => {
        if (uploadedFiles.length === 0) return
        
        setVerificationStatus('submitting')
        try {
            await authService.submitIdentityVerification({
                documentType: selectedDocType,
                fileKey: uploadedFiles[0].fileKey
            })
            setVerificationStatus('pending')
            toast.success("Verification submitted successfully")
        } catch (error: any) {
            setVerificationStatus('idle')
            toast.error(error.message || "Failed to submit verification")
        }
    }

    return (
        <Card className={cn("transition-all duration-500", verificationStatus === 'pending' ? 'border-primary/50 bg-primary/5 shadow-lg shadow-primary/5' : '')}>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Shield className={cn("h-5 w-5 transition-colors", verificationStatus === 'pending' ? 'text-primary' : 'text-muted-foreground')} />
                    <CardTitle>Identity Verification</CardTitle>
                </div>
                <CardDescription>Verify your identity to unlock all features</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                {verificationStatus === 'pending' ? (
                    <VerificationPending docType={selectedDocType} />
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
            {verificationStatus !== 'pending' && uploadedFiles.length > 0 && (
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
