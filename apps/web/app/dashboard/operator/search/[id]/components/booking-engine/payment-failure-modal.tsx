'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog'
import { Button } from '@workspace/ui/components/button'
import { AlertTriangle, CreditCard, RefreshCw } from 'lucide-react'

interface PaymentFailureModalProps {
  isOpen: boolean
  errorMessage: string | null
  bookingReference?: string | null
  onClose: () => void
  onRetry: () => void
}

const ERROR_HINTS: Array<{ match: string; hint: string }> = [
  { match: 'card_declined', hint: 'Your card was declined. Please try a different card.' },
  { match: 'insufficient_funds', hint: 'Your card has insufficient funds. Please use a different card.' },
  { match: 'authentication', hint: 'Payment authentication failed. Please try again.' },
  { match: 'expired_card', hint: 'Your card has expired. Please update your payment method.' },
  { match: 'incorrect_cvc', hint: 'The card CVC is incorrect. Please check your card details.' },
]

function getErrorHint(message: string | null): string {
  if (!message) return 'An unexpected error occurred during payment processing.'
  const lower = message.toLowerCase()
  for (const { match, hint } of ERROR_HINTS) {
    if (lower.includes(match)) return hint
  }
  return message
}

export function PaymentFailureModal({
  isOpen,
  errorMessage,
  bookingReference,
  onClose,
  onRetry,
}: PaymentFailureModalProps) {
  const router = useRouter()
  const hint = getErrorHint(errorMessage)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden gap-0">
        {/* Red top bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-red-500 to-red-600" />

        <DialogHeader className="p-6 pb-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-red-50 border border-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div className="space-y-1 pt-1">
              <DialogTitle className="text-base font-bold tracking-tight text-red-900">
                Payment Failed
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {bookingReference
                  ? `Booking ${bookingReference} could not be processed.`
                  : 'Your booking could not be completed.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4">
          {/* Error detail */}
          <div className="rounded-xl border border-red-100 bg-red-50/60 p-4">
            <p className="text-sm font-medium text-red-900 leading-relaxed">{hint}</p>
          </div>

          {/* What to do */}
          <div className="rounded-xl border border-border/50 bg-muted/30 p-4 space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              What can I do?
            </p>
            <ul className="space-y-2 text-sm text-foreground/80">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-primary font-bold">1.</span>
                Update your payment method in billing settings.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-primary font-bold">2.</span>
                Then return here and try booking again.
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter className="px-6 pb-6 flex flex-col gap-2 sm:flex-col">
          <Button
            className="w-full gap-2 font-bold text-[11px] uppercase tracking-widest"
            onClick={() => router.push('/dashboard/operator/billing')}
          >
            <CreditCard className="h-4 w-4" />
            Update Payment Method
          </Button>
          <Button
            variant="outline"
            className="w-full gap-2 font-bold text-[11px] uppercase tracking-widest"
            onClick={() => {
              onClose()
              onRetry()
            }}
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground text-xs"
            onClick={onClose}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
