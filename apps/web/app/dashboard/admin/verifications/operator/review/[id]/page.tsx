'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { ReviewHeader } from './components/review-header'
import { OperatorContextColumn } from './components/operator-context-column'
import { EvidenceColumn } from './components/evidence-column'
import { RejectionModal } from './components/rejection-modal'

import {
  adminService,
  type VerificationRequest,
} from '@/services/admin.service'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'

export default function OperatorReviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = React.use(params)
  const router = useRouter()
  const [verification, setVerification] =
    React.useState<VerificationRequest | null>(null)
  const [isLoading, setIsLoading] = React.useState(true) // Initialized to true
  const [isActionLoading, setIsActionLoading] = React.useState(false)
  const [isRejectionModalOpen, setIsRejectionModalOpen] = React.useState(false)
  const fetchedIdRef = React.useRef<string | null>(null)

  React.useEffect(() => {
    let isMounted = true

    const fetchVerification = async () => {
      // Prevent double fetching the same ID
      if (fetchedIdRef.current === id) return

      try {
        const response = await adminService.getVerificationById(id)

        if (!isMounted) return

        if (response.success && response.data) {
          setVerification(response.data)
          fetchedIdRef.current = id
        } else {
          toast.error('Verification request not found')
          router.push('/dashboard/admin/verifications/operator')
        }
      } catch (error) {
        if (!isMounted) return
        console.error('Failed to fetch verification:', error)
        toast.error('Failed to load verification details')
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchVerification()

    return () => {
      isMounted = false // Cleanup function to prevent setting state on unmounted component
    }
  }, [id, router])

  const handleApprove = async () => {
    if (!verification) return
    setIsActionLoading(true)
    try {
      const response = await adminService.updateVerification(
        verification.id,
        'APPROVED',
      )
      if (response.success) {
        toast.success('Operator Verified', {
          description: `${verification.userName} is now cleared for flight operations.`,
        })
        router.push('/dashboard/admin/verifications/operator')
      }
    } catch (error) {
      console.error('Failed to approve operator:', error)
      toast.error('Failed to approve operator')
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleRejectConfirm = async (reasons: string[], customNote: string) => {
    if (!verification) return
    setIsActionLoading(true)
    try {
      const adminNote = [reasons.join(', '), customNote].filter(Boolean).join('. ').trim()
      const response = await adminService.updateVerification(
        verification.id,
        'REJECTED',
        adminNote,
      )
      if (response.success) {
        toast.error('Verification Rejected', {
          description: 'Feedback has been sent to the operator.',
        })
        setIsRejectionModalOpen(false)
        router.push('/dashboard/admin/verifications/operator')
      }
    } catch (error) {
      console.error('Failed to reject operator:', error)
      toast.error('Failed to reject operator')
    } finally {
      setIsActionLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!verification) return null

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ReviewHeader name={verification.userName} />

      <div className="flex-1 bg-muted/10 py-6 md:py-8 relative">
        <div className="max-w-3xl mx-auto w-full px-4 space-y-6">
          <OperatorContextColumn verification={verification} />
          <EvidenceColumn verification={verification} />

          {/* Action Footer (Non-sticky) */}
          <div className="bg-background border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-widest">
              Approval grants booking rights across the network
            </p>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                variant="destructive"
                onClick={() => setIsRejectionModalOpen(true)}
                className="w-full sm:w-auto"
                disabled={isActionLoading}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                onClick={handleApprove}
                className="w-full sm:w-auto"
                disabled={isActionLoading}
              >
                {isActionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Approve Operator
              </Button>
            </div>
          </div>
        </div>
      </div>

      <RejectionModal
        isOpen={isRejectionModalOpen}
        onClose={() => setIsRejectionModalOpen(false)}
        onConfirm={handleRejectConfirm}
        isLoading={isActionLoading}
      />
    </div>
  )
}
