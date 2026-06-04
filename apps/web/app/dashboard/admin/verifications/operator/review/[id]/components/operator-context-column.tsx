'use client'

import * as React from 'react'
import {
  User,
  Mail,
  ShieldCheck,
  Award,
  FileCheck,
  Briefcase,
} from 'lucide-react'
import { DetailBox } from './ui-helpers'

interface OperatorContextColumnProps {
  verification: any
}

export function OperatorContextColumn({
  verification,
}: OperatorContextColumnProps) {
  return (
    <div className="space-y-8 bg-background border rounded-xl p-4 md:p-6 shadow-sm">
      {/* 1. Pilot / Company Identity */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 border-b pb-3">
          <div className="p-1.5 rounded-md bg-muted">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-bold tracking-tight">Operator Profile</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <DetailBox
            label="Full Name / Entity"
            value={verification.userName}
            icon={Briefcase}
          />
          <DetailBox
            label="Email Address"
            value={verification.userEmail}
            icon={Mail}
          />
          <DetailBox
            label="Organisation"
            value={verification.userOrganisation || 'Not Provided'}
            icon={Briefcase}
          />
          <DetailBox
            label="CAA Operator ID"
            value={verification.flyerId || 'N/A'}
            isHighlight
            icon={Award}
          />
        </div>
      </div>

      {/* 2. Verification Metadata */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 border-b pb-3">
          <div className="p-1.5 rounded-md bg-muted">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 p-4 bg-muted/5 rounded-xl border border-border/40">
          <DetailBox
            label="Submission Date"
            value={new Date(verification.createdAt).toLocaleDateString()}
            icon={FileCheck}
          />
          <DetailBox
            label="Status"
            value={verification.status}
            isBadge
            badgeVariant={
              verification.status === 'PENDING' ? 'amber' : 'emerald'
            }
          />
        </div>
      </div>
    </div>
  )
}
