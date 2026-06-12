'use client'

import * as React from 'react'
import { User, Mail, Building2, Calendar, ShieldCheck, Hash, ShieldAlert, Copy } from 'lucide-react'
import { DetailBox, DocumentListItem } from './UiHelpers'
import { Button } from '@workspace/ui/components/button'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface AssetManagerDetailsCardProps {
  verification: any
}

export function AssetManagerDetailsCard({
  verification,
}: AssetManagerDetailsCardProps) {
  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id)
    toast.success('Asset Manager VA ID copied to clipboard')
  }

  // Format account status
  const accountStatus = verification.accountStatus || 'UNVERIFIED'
  const formattedAccountStatus =
    accountStatus.charAt(0).toUpperCase() +
    accountStatus.slice(1).toLowerCase().replace(/_/g, ' ')

  let accountBadgeVariant: 'emerald' | 'amber' | 'destructive' | 'orange' = 'amber'
  if (accountStatus === 'VERIFIED') {
    accountBadgeVariant = 'emerald'
  } else if (accountStatus === 'SUSPENDED' || accountStatus === 'BANNED') {
    accountBadgeVariant = 'destructive'
  } else if (accountStatus === 'PAYMENT_LOCKED') {
    accountBadgeVariant = 'orange'
  }

  // Format verification status
  const verificationStatus = verification.status || 'PENDING'
  const formattedVerificationStatus =
    verificationStatus.charAt(0).toUpperCase() +
    verificationStatus.slice(1).toLowerCase()

  let verificationBadgeVariant: 'emerald' | 'amber' | 'destructive' = 'amber'
  if (verificationStatus === 'APPROVED') {
    verificationBadgeVariant = 'emerald'
  } else if (verificationStatus === 'REJECTED') {
    verificationBadgeVariant = 'destructive'
  }

  // Format submission date
  const submittedAt = verification.createdAt
    ? format(new Date(verification.createdAt), 'dd MMM yyyy, HH:mm')
    : 'N/A'

  const documents = verification.submittedDocuments || []
  const displayId = (verification.userVaId || verification.userId || '').toUpperCase()

  return (
    <div className="bg-background border rounded-xl p-6 md:p-8 shadow-sm space-y-6 md:space-y-8">
      {/* 2-Column details layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {/* Left column: Identity Details */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border/50">
            <Building2 className="h-4.5 w-4.5 text-primary" />
            <h3 className="font-semibold text-foreground text-sm">Identity Details</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                <Hash className="h-3.5 w-3.5" />
                <span>Asset Manager ID</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-sm text-foreground font-semibold select-all">
                  {displayId}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 hover:text-foreground shrink-0"
                  onClick={() => handleCopyId(displayId)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <DetailBox
              label="Full Name"
              value={verification.userName || 'Unknown User'}
              icon={User}
            />
            <DetailBox
              label="Organisation"
              value={verification.userOrganisation || 'N/A'}
              icon={Building2}
            />
            <DetailBox
              label="Email Address"
              value={verification.userEmail || 'N/A'}
              icon={Mail}
            />
          </div>
        </div>

        {/* Right column: Verification Details */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border/50">
            <ShieldCheck className="h-4.5 w-4.5 text-primary" />
            <h3 className="font-semibold text-foreground text-sm">Verification Details</h3>
          </div>

          <div className="space-y-4">
            <DetailBox
              label="Submitted Date & Time"
              value={submittedAt}
              icon={Calendar}
            />
            <DetailBox
              label="Account Status"
              value={formattedAccountStatus}
              icon={ShieldAlert}
              isBadge
              badgeVariant={accountBadgeVariant}
            />
            <DetailBox
              label="Verification Status"
              value={formattedVerificationStatus}
              icon={ShieldCheck}
              isBadge
              badgeVariant={verificationBadgeVariant}
            />
          </div>
        </div>
      </div>

      {/* Full width bottom section: Submitted Evidence */}
      <div className="border-t border-border/60 pt-6 space-y-4">
        <div className="flex items-center gap-2 pb-2">
          <ShieldCheck className="h-4.5 w-4.5 text-primary" />
          <h3 className="font-semibold text-foreground text-sm">Submitted Evidence</h3>
        </div>

        <div className="space-y-2">
          {documents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {documents.map((doc: any, index: number) => {
                const docType = doc.documentType?.replace(/_/g, ' ') || 'Identity Document'
                const formattedType = docType.charAt(0).toUpperCase() + docType.slice(1).toLowerCase()
                return (
                  <DocumentListItem
                    key={index}
                    name={
                      doc.fileName ||
                      doc.fileKey?.split('/').pop() ||
                      `Document ${index + 1}`
                    }
                    type={formattedType}
                    url={doc.downloadUrl}
                  />
                )
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic px-1">
              No documents submitted for this request.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
