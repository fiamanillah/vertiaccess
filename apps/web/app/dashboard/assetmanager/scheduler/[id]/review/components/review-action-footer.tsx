import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ShieldAlert } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import type { Booking } from '../../../types'

interface ReviewActionFooterProps {
  booking: Booking
  isActionSubmitting: boolean
  onApprove: () => void
  onReject: () => void
}

export function ReviewActionFooter({
  booking,
  isActionSubmitting,
  onApprove,
  onReject,
}: ReviewActionFooterProps) {
  const router = useRouter()

  if (booking.status !== 'PENDING' && booking.status !== 'APPROVED') return null

  return (
    <div className="p-2 border-t border-border/40 bg-muted/10 shrink-0 flex flex-col gap-3">
      {booking.status === 'PENDING' ? (
        <div className="grid grid-cols-2 gap-3 w-full">
          <Button
            variant="destructive"
            onClick={onReject}
            disabled={isActionSubmitting}
          >
            Decline
          </Button>
          <Button
            variant="default"
            onClick={onApprove}
            disabled={isActionSubmitting}
          >
            {isActionSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Approve...
              </>
            ) : (
              'Approve Access'
            )}
          </Button>
        </div>
      ) : (
        <div className="text-center py-2 space-y-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs font-semibold h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/20 border border-transparent gap-2"
            onClick={() =>
              router.push(
                `/dashboard/assetmanager/incident-report/new?bookingId=${booking.id}&siteId=${booking.siteId}`,
              )
            }
          >
            <ShieldAlert className="h-4 w-4" />
            Report an Issue
          </Button>
        </div>
      )}
    </div>
  )
}
