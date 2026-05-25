'use client';

import * as React from 'react'
import { ShieldCheck, QrCode } from 'lucide-react'

export const SecurityPattern = () => (
  <svg
    className="absolute inset-0 h-full w-full opacity-[0.04] mix-blend-overlay pointer-events-none"
    xmlns="http://www.w3.org/2000/svg"
    width="100%"
    height="100%"
  >
    <defs>
      <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
        <path
          d="M 24 0 L 0 0 0 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#grid)" />
  </svg>
)

export const SecuritySeal = () => (
  <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-primary/30 bg-primary/5 p-1 print:h-12 print:w-12">
    <div className="flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-primary">
      <ShieldCheck className="h-8 w-8 print:h-6 print:w-6" />
    </div>
    <div className="absolute -inset-1 rounded-full border border-dashed border-primary/20 animate-[spin_20s_linear_infinite] print:hidden" />
  </div>
)

export const DigitalSignatureBlock = ({ vaId }: { vaId: string }) => (
  <div className="flex items-center gap-4 rounded-xl border border-border/50 bg-muted/30 p-4 print:p-3 signature-block">
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-foreground text-background print:h-10 print:w-10">
      <QrCode className="h-8 w-8 print:h-6 print:w-6" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">
        Cryptographic Signature
      </p>
      <p className="font-mono text-[10px] font-bold text-foreground truncate">
        {vaId}-SECURE-SIG-{(vaId || '').split('').reverse().join('')}
      </p>
      <p className="text-[8px] text-primary font-semibold flex items-center gap-1 mt-0.5">
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse print:hidden" />
        Verified & Active Consent
      </p>
    </div>
  </div>
)
