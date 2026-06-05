'use client'

import * as React from 'react'
import { User, Mail, Building2, Calendar, ShieldCheck } from 'lucide-react'
import { DetailBox } from './ui-helpers'

interface AssetOwnerContextColumnProps {
  verification: any
}

export function AssetOwnerContextColumn({
  verification,
}: AssetOwnerContextColumnProps) {
  return (
    <div className="space-y-8 bg-background border rounded-xl p-4 md:p-6 shadow-sm">
      {/* 1. Identity */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 border-b pb-3">
          <div className="p-1.5 rounded-md bg-muted">
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-bold tracking-tight">Identity Details</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <DetailBox
            label="Full Name"
            value={verification.userName || 'Unknown'}
            icon={User}
          />
          <DetailBox
            label="Company / Estate"
            value={verification.userOrganisation || 'Not Provided'}
            icon={Building2}
          />
          <DetailBox
            label="Email Address"
            value={verification.userEmail}
            icon={Mail}
          />
        </div>
      </div>

      {/* 2. Request Details */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 border-b pb-3">
          <div className="p-1.5 rounded-md bg-muted">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-bold tracking-tight">Request Details</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 p-4 bg-muted/5 rounded-xl border border-border/40">
          <DetailBox
            label="Submission Date"
            value={new Date(verification.createdAt).toLocaleDateString()}
            icon={Calendar}
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
