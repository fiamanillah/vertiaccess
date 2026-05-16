'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { ReviewHeader } from './components/review-header'
import { LandownerContextColumn } from './components/landowner-context-column'
import { EvidenceColumn } from './components/evidence-column'
import { RejectionModal } from './components/rejection-modal'

import {
  adminService,
  type VerificationRequest,
} from '@/services/admin.service'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'

export default function LandownerReviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = React.use(params)
  const router = useRouter()
  const [verification, setVerification] =
    React.useState<VerificationRequest | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isRejectionModalOpen, setIsRejectionModalOpen] = React.useState(false)
  const [isProcessing, setIsProcessing] = React.useState(false)
  const fetchedIdRef = React.useRef<string | null>(null)

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
          router.push('/dashboard/admin/verifications/landowner')
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
    setIsProcessing(true)
    try {
      const response = await adminService.updateVerification(
        verification.id,
        'APPROVED',
      )
      if (response.success) {
        toast.success('Landowner Verified', {
          description: `${verification.userName} now has full access to the platform.`,
        })
        router.push('/dashboard/admin/verifications/landowner')
      }
    } catch (error) {
      console.error('Approval failed:', error)
      toast.error('Failed to approve verification')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRejectConfirm = async (reasons: string[], customNote: string) => {
    if (!verification) return
    setIsProcessing(true)
    try {
      const adminNote = [reasons.join(', '), customNote].filter(Boolean).join('. ').trim()
      const response = await adminService.updateVerification(
        verification.id,
        'REJECTED',
        adminNote,
      )
      if (response.success) {
        toast.error('Verification Rejected', {
          description: 'Feedback has been sent to the landowner.',
        })
        setIsRejectionModalOpen(false)
        router.push('/dashboard/admin/verifications/landowner')
      }
    } catch (error) {
      console.error('Rejection failed:', error)
      toast.error('Failed to reject verification')
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
          Loading dossier...
        </p>
      </div>
    )
  }

  if (!verification) return null

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ReviewHeader name={verification.userName} />

      <div className="flex-1 bg-muted/10 py-6 md:py-8 relative">
        {isProcessing && (
          <div className="absolute inset-0 z-50 bg-background/40 backdrop-blur-[2px] flex items-center justify-center">
            <div className="bg-background border p-4 rounded-xl shadow-xl flex items-center gap-3">
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
              <span className="text-sm font-bold uppercase tracking-tight">
                Processing decision...
              </span>
            </div>
          </div>
        )}
        <div className="max-w-3xl mx-auto w-full px-4 space-y-6">
          <LandownerContextColumn verification={verification} />
          <EvidenceColumn verification={verification} />

          {/* Action Footer (Non-sticky) */}
          <div className="bg-background border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-widest">
              Verification grants full property management rights
            </p>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                variant="destructive"
                onClick={() => setIsRejectionModalOpen(true)}
                disabled={isProcessing}
                className="w-full sm:w-auto"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button 
                onClick={handleApprove} 
                disabled={isProcessing}
                className="w-full sm:w-auto"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Approve Landowner
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
