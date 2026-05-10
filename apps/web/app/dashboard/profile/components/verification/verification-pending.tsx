'use client'

import { Clock, Loader2 } from "lucide-react"

interface VerificationPendingProps {
  docType: 'national_id' | 'passport'
}

export function VerificationPending({ docType }: VerificationPendingProps) {
  return (
    <div className="flex flex-col items-center justify-center py-5 text-center gap-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="relative">
        <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center">
          <Clock className="h-10 w-10 text-primary " />
        </div>
      </div>
      <div className="space-y-2">
        <h3 className="text-2xl font-bold tracking-tight">Verification Pending</h3>
        <p className="text-sm text-muted-foreground  mx-auto leading-relaxed">
          We've received your <span className="font-semibold text-foreground">{docType === 'national_id' ? 'National ID' : 'Passport'}</span> documents. Our compliance team is currently reviewing your submission.
        </p>
      </div>
    </div>
  )
}
