'use client'

import * as React from 'react'
import { ShieldCheck, AlertTriangle, Scale } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
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
import { Booking } from '../types'

interface EmergencyBannerProps {
  booking: Booking
  onResolve: (booking: Booking, used: boolean) => void
}

export function EmergencyBanner({ booking, onResolve }: EmergencyBannerProps) {
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false)

  return (
    <>
      <div className="bg-destructive text-destructive-foreground p-4 sm:px-6 rounded-2xl shadow-lg mb-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-center gap-4">
          <div className="bg-destructive-foreground/15 p-2.5 rounded-xl backdrop-blur-sm">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-sm font-black uppercase tracking-widest leading-none">
              Emergency Usage Confirmation
            </h3>
            <p className="text-xs font-medium text-destructive-foreground/90">
              Your flight window for{' '}
              <span className="font-bold underline decoration-destructive-foreground/30 underline-offset-2">
                {booking.siteName}
              </span>{' '}
              has closed. Did you utilize this site?
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button
            className="flex-1 md:flex-none bg-background text-foreground hover:bg-background/90 font-black text-[10px] uppercase tracking-widest h-10 px-6 shadow-sm"
            onClick={() => onResolve(booking, true)}
          >
            Yes, I landed here
          </Button>
          <Button
            variant="ghost"
            className="flex-1 md:flex-none text-destructive-foreground hover:bg-destructive-foreground/10 font-black text-[10px] uppercase tracking-widest h-10 px-6 border border-destructive-foreground/20"
            onClick={() => setIsConfirmOpen(true)}
          >
            No, flight was nominal
          </Button>
        </div>
      </div>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent className="max-w-105 p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-red-600 h-2" />
          <div className="p-6">
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-red-100 p-2 rounded-full">
                  <Scale className="h-5 w-5 text-red-600" />
                </div>
                <AlertDialogTitle className="text-xl font-black tracking-tight uppercase">
                  Legally Binding Declaration
                </AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-sm font-bold text-foreground leading-relaxed">
                You are declaring that no drone landed on or utilized this
                property. Landowners monitor their sites.
                <br />
                <br />
                <span className="text-red-600">
                  Fraudulent claims of non-usage will result in an automatic
                  £500 penalty fee, and your VertiAccess Operator account will
                  be permanently suspended.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-8 flex flex-col sm:flex-row gap-3">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() => {
                  onResolve(booking, false)
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
