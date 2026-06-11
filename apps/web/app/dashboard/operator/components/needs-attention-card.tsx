'use client'

import * as React from 'react'
import { ShieldCheck, AlertTriangle, Scale, Loader2 } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import { Alert, AlertTitle, AlertDescription } from '@workspace/ui/components/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@workspace/ui/components/alert-dialog'
import { bookingService } from '@/services/booking.service'
import type { Booking } from '@/services/booking.types'
import { toast } from 'sonner'

interface NeedsAttentionCardProps {
  booking: Booking
  onResolve: (updatedBooking: Booking) => void
}

export function NeedsAttentionCard({ booking, onResolve }: NeedsAttentionCardProps) {
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleResolve = async (used: boolean) => {
    try {
      setIsSubmitting(true)
      const updated = await bookingService.confirmEmergencyUsage(booking.id, used)
      toast.success(
        used
          ? 'Emergency usage confirmed. Payment is processing.'
          : 'No usage confirmed. No charge applied.',
      )
      onResolve(updated)
    } catch (error: any) {
      const msg = error instanceof Error ? error.message : 'Failed to resolve emergency usage'
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Alert className="bg-destructive text-destructive-foreground border-destructive/30 shadow-lg p-5 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-start gap-4">
          <div className="bg-destructive-foreground/15 p-2.5 rounded-xl backdrop-blur-sm shrink-0">
            <AlertTriangle className="h-5 w-5 text-destructive-foreground" />
          </div>
          <div className="space-y-1">
            <AlertTitle className="text-sm font-extrabold uppercase tracking-wider leading-none text-destructive-foreground">
              Action Required: Emergency Landing Confirmation
            </AlertTitle>
            <AlertDescription className="text-xs font-medium text-destructive-foreground/90 leading-relaxed">
              Your flight window at emergency recovery site{' '}
              <span className="font-bold underline decoration-destructive-foreground/30 underline-offset-2">
                {booking.siteName || 'Unknown Site'}
              </span>{' '}
              (Ref: <span className="font-mono">{booking.bookingReference}</span>) has closed.
              Please confirm whether your aircraft landed at this site.
            </AlertDescription>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
          <Button
            size="sm"
            disabled={isSubmitting}
            className="flex-1 md:flex-none bg-background text-foreground hover:bg-background/90 font-bold text-[10px] uppercase tracking-wider h-9 px-4 shadow-sm"
            onClick={() => handleResolve(true)}
          >
            {isSubmitting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            Yes, I landed here
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={isSubmitting}
            className="flex-1 md:flex-none text-destructive-foreground hover:bg-destructive-foreground/10 font-bold text-[10px] uppercase tracking-wider h-9 px-4 border border-destructive-foreground/20"
            onClick={() => setIsConfirmOpen(true)}
          >
            No, flight was nominal
          </Button>
        </div>
      </Alert>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl bg-background text-foreground">
          <div className="bg-red-600 h-2" />
          <div className="p-6">
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-red-100 dark:bg-red-950/40 p-2 rounded-full">
                  <Scale className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <AlertDialogTitle className="text-base font-extrabold tracking-tight uppercase">
                  Legally Binding Declaration
                </AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-xs font-bold text-foreground leading-relaxed">
                You are declaring that no drone landed on or utilized this property.
                Asset owners monitor their sites.
                <br />
                <br />
                <span className="text-red-600 dark:text-red-400">
                  Fraudulent claims of non-usage will result in an automatic £500 penalty fee,
                  and your VertiAccess Operator account will be permanently suspended.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-6 flex flex-col sm:flex-row gap-2">
              <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={isSubmitting}
                onClick={async () => {
                  await handleResolve(false)
                  setIsConfirmOpen(false)
                }}
              >
                I Confirm I Did Not Land
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
