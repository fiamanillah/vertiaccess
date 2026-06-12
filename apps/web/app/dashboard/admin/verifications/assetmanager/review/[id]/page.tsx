'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { ReviewHeader } from './_components/ReviewHeader'
import { AssetManagerDetailsCard } from './_components/AssetManagerDetailsCard'
import { RejectionModal } from './_components/RejectionModal'

import { adminService, type VerificationRequest } from '@/services/admin.service'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import { Skeleton } from '@workspace/ui/components/skeleton'

export default function AssetManagerReviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = React.use(params)
  const router = useRouter()
  const [verification, setVerification] = React.useState<VerificationRequest | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isRejectionModalOpen, setIsRejectionModalOpen] = React.useState(false)
  const [processingAction, setProcessingAction] = React.useState<'approve' | 'reject' | null>(null)
  const fetchedIdRef = React.useRef<string | null>(null)

  const isProcessing = processingAction !== null

  // 1. Pure data fetching logic
  const fetchReviewData = React.useCallback(async (targetId: string) => {
    const response = await adminService.getVerificationById(targetId)
    if (response.success && response.data) {
      return response.data
    }
    throw new Error('Verification request not found')
  }, [])

  // 2. Initial Synchronization (Effect)
  React.useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      try {
        const data = await fetchReviewData(id)
        if (isMounted) {
          setVerification(data)
          fetchedIdRef.current = id
        }
      } catch (error) {
        if (isMounted) {
          console.error('Failed to fetch verification:', error)
          toast.error('Failed to load verification details')
          router.push('/dashboard/admin/verifications/assetmanager')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [id, router, fetchReviewData])

  const handleApprove = async () => {
    if (!verification) return
    setProcessingAction('approve')
    try {
      const response = await adminService.updateVerification(
        verification.id,
        'APPROVED',
      )
      if (response.success) {
        toast.success('Asset Manager Verified', {
          description: `${verification.userName} now has full access to the platform.`,
        })
        router.push('/dashboard/admin/verifications/assetmanager')
      }
    } catch (error) {
      console.error('Approval failed:', error)
      toast.error('Failed to approve verification')
    } finally {
      setProcessingAction(null)
    }
  }

  const handleRejectConfirm = async (reasons: string[], customNote: string) => {
    if (!verification) return
    setProcessingAction('reject')
    try {
      const adminNote = [reasons.join(', '), customNote].filter(Boolean).join('. ').trim()
      const response = await adminService.updateVerification(
        verification.id,
        'REJECTED',
        adminNote,
      )
      if (response.success) {
        toast.error('Verification Rejected', {
          description: 'Feedback has been sent to the asset owner.',
        })
        setIsRejectionModalOpen(false)
        router.push('/dashboard/admin/verifications/assetmanager')
      }
    } catch (error) {
      console.error('Rejection failed:', error)
      toast.error('Failed to reject verification')
    } finally {
      setProcessingAction(null)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 border-b bg-muted/5">
          <div className="flex items-center gap-4">
            <Skeleton className="h-9 w-32" />
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>

        {/* Content Skeleton */}
        <div className="flex-1 bg-muted/10 py-6 md:py-8">
          <div className="max-w-3xl mx-auto w-full px-4 space-y-6">
            {/* Unified Card Skeleton */}
            <div className="bg-background border rounded-xl p-6 md:p-8 shadow-sm space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {/* Identity Details Skeleton */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <Skeleton className="h-5 w-32" />
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-5 w-40" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-5.5 w-48" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-28" />
                      <Skeleton className="h-5.5 w-56" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-5.5 w-52" />
                    </div>
                  </div>
                </div>

                {/* Verification Details Skeleton */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <Skeleton className="h-5 w-32" />
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-5 w-44" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-28" />
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submitted Evidence Skeleton */}
              <div className="border-t border-border/60 pt-6 space-y-4">
                <Skeleton className="h-5 w-36" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Skeleton className="h-14 w-full rounded-xl" />
                  <Skeleton className="h-14 w-full rounded-xl" />
                </div>
              </div>
            </div>

            {/* Action Footer Skeleton */}
            <div className="bg-background border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <Skeleton className="h-4 w-72" />
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Skeleton className="h-10 w-full sm:w-24 rounded-md" />
                <Skeleton className="h-10 w-full sm:w-44 rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!verification) return null

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ReviewHeader name={verification.userName} status={verification.status} />

      <div className="flex-1 bg-muted/10 py-6 md:py-8 relative">
        <div className="max-w-3xl mx-auto w-full px-4 space-y-6">
          <AssetManagerDetailsCard verification={verification} />

          {/* Action Footer (Non-sticky) */}
          <div className="bg-background border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
            <p className="text-xs text-muted-foreground font-semibold">
              Verification grants full property management rights
            </p>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                variant="destructive"
                onClick={() => setIsRejectionModalOpen(true)}
                disabled={isProcessing}
                className="w-full sm:w-auto h-10"
              >
                {processingAction === 'reject' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Reject
              </Button>
              <Button
                onClick={handleApprove}
                disabled={isProcessing}
                className="w-full sm:w-auto h-10"
              >
                {processingAction === 'approve' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Approve Asset Manager
              </Button>
            </div>
          </div>
        </div>
      </div>

      <RejectionModal
        isOpen={isRejectionModalOpen}
        onClose={() => setIsRejectionModalOpen(false)}
        onConfirm={handleRejectConfirm}
        isLoading={isProcessing}
      />
    </div>
  )
}
