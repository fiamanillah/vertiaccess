import * as React from 'react'
import { format } from 'date-fns'
import { Badge } from '@workspace/ui/components/badge'
import { ExternalLink, FileText, Info } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip'
import { DetailRow } from './review-detail-row'
import { formatBoundarySummary } from './review-geometry-utils'
import type { Booking } from '../../../types'

export function getPaymentStatusBadge(b: Booking) {
  const isEmergency = b.useCategory === 'emergency_recovery'
  const status = b.paymentStatus

  if (isEmergency) {
    if (status === 'charged') {
      return {
        label: 'Paid',
        className:
          'bg-emerald-50/10 text-emerald-700 border-emerald-200 font-medium text-xs px-2 py-0.5 shadow-none',
        tooltip: 'Payment has been successfully processed.',
      }
    }
    if (status === 'failed') {
      return {
        label: 'Failed',
        className:
          'bg-red-50/10 text-red-700 border-red-200 font-medium text-xs px-2 py-0.5 shadow-none',
        tooltip:
          'Emergency landing charge failed. Operator account may be locked.',
      }
    }
    return {
      label: 'Pending (Standby)',
      className:
        'bg-amber-50/10 text-amber-700 border-amber-200 font-medium text-xs px-2 py-0.5 shadow-none',
      tooltip:
        'Payment is pending. For emergency and recovery, funds are only captured when the site is accessed.',
    }
  } else {
    switch (status) {
      case 'charged':
        return {
          label: 'Paid',
          className:
            'bg-emerald-50/10 text-emerald-700 border-emerald-200 font-medium text-xs px-2 py-0.5 shadow-none',
          tooltip: 'Payment has been successfully processed.',
        }
      case 'failed':
        return {
          label: 'Failed',
          className:
            'bg-red-50/10 text-red-700 border-red-200 font-medium text-xs px-2 py-0.5 shadow-none',
          tooltip:
            'The card charge attempt failed. Please check payment details.',
        }
      case 'pending_charge':
        return {
          label: 'Processing',
          className:
            'bg-blue-50/10 text-blue-700 border-blue-200 font-medium text-xs px-2 py-0.5 shadow-none animate-pulse',
          tooltip: 'Payment is currently being processed.',
        }
      case 'pending':
      default:
        if (b.status === 'PENDING') {
          return {
            label: 'Pending Approval',
            className:
              'bg-amber-50/10 text-amber-700 border-amber-200 font-medium text-xs px-2 py-0.5 shadow-none',
            tooltip: 'Payment is pending asset owner approval.',
          }
        }
        return {
          label: 'Pending Payment',
          className:
            'bg-amber-50/10 text-amber-700 border-amber-200 font-medium text-xs px-2 py-0.5 shadow-none',
          tooltip: 'Payment is pending charge on approval.',
        }
    }
  }
}

function PaymentStatusBadge({ booking }: { booking: Booking }) {
  const badgeInfo = getPaymentStatusBadge(booking)
  return (
    <div className="flex items-center gap-1.5 justify-end">
      <Badge className={badgeInfo.className}>{badgeInfo.label}</Badge>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-pointer" />
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[240px] text-center">
            <p className="text-xs">{badgeInfo.tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

// ─── Section Components ───────────────────────────────────────────────────────

interface SectionProps {
  booking: Booking
}

export function RequestDetailsSection({ booking }: SectionProps) {
  return (
    <div className="space-y-1.5">
      <div className="bg-muted/10 rounded-lg p-3 border border-border/30 divide-y divide-border/20">
        <DetailRow
          label="Request ID"
          value={
            <span className="font-mono text-sm text-foreground">
              {(
                booking.bookingReference ??
                booking.vaId ??
                'N/A'
              ).toUpperCase()}
            </span>
          }
        />
        <DetailRow
          label="Capability Requested"
          value={
            <div className="flex items-center gap-2">
              <Badge
                className={
                  booking.useCategory === 'planned_toal'
                    ? 'bg-indigo-500 hover:bg-indigo-600 font-medium text-xs px-2 py-0.5'
                    : 'bg-amber-500 hover:bg-amber-600 font-medium text-xs px-2 py-0.5'
                }
              >
                {booking.useCategory === 'planned_toal'
                  ? 'TOAL'
                  : 'Emergency Recovery'}
              </Badge>
              {booking.operationType && (
                <Badge className="bg-blue-500 hover:bg-blue-600 font-medium text-xs px-2 py-0.5">
                  {booking.operationType === 'INBOUND' ? 'Inbound' : 'Outbound'}
                </Badge>
              )}
            </div>
          }
        />
        <div className="py-2 text-sm">
          <span className="text-sm font-medium text-muted-foreground block mb-0.5">
            Operational Intent
          </span>
          <span className="font-normal text-foreground italic text-sm leading-relaxed block">
            "
            {booking.missionIntent ||
              'No operational intent description provided.'}
            "
          </span>
        </div>
      </div>
    </div>
  )
}

export function AssetInformationSection({ booking }: SectionProps) {
  return (
    <div className="space-y-1.5">
      <h3 className="text-base font-semibold text-primary">
        Asset Information
      </h3>
      <div className="bg-muted/10 rounded-lg p-3 border border-border/30 divide-y divide-border/20">
        <DetailRow label="Asset Name" value={booking.siteName || 'N/A'} />
        <DetailRow
          label="Asset ID"
          value={
            <span className="font-mono text-sm text-foreground">
              {(booking.siteVaId || 'N/A').toUpperCase()}
            </span>
          }
        />
        <DetailRow
          label="Asset Type"
          value={
            booking.siteCategory
              ? booking.siteCategory
                  .split('_')
                  .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(' ')
              : 'N/A'
          }
        />
        {booking.siteType && (
          <DetailRow
            label="Asset Zone Type"
            value={
              booking.siteType === 'emergency'
                ? 'Emergency Recovery'
                : 'Take-off & Landing (TOAL)'
            }
          />
        )}
        <DetailRow
          label="Asset Status"
          value={(() => {
            const status = booking.siteStatus?.toUpperCase() || 'ACTIVE'
            let dotColor = 'bg-emerald-500'
            if (status === 'DISABLE' || status === 'DISABLED') {
              dotColor = 'bg-red-500'
            } else if (
              status === 'TEMPORARY_RESTRICTED' ||
              status === 'TEMPORARY_UNAVAILABLE' ||
              status === 'TEMPORARILY_UNAVAILABLE'
            ) {
              dotColor = 'bg-orange-500'
            }
            return (
              <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                <span
                  className={`h-1.5 w-1.5 rounded-full animate-pulse ${dotColor}`}
                />
                {booking.siteStatus
                  ? booking.siteStatus.charAt(0).toUpperCase() +
                    booking.siteStatus.slice(1).toLowerCase()
                  : 'Active'}
              </span>
            )
          })()}
        />
        <div className="py-2 text-sm">
          <span className="text-sm font-medium text-muted-foreground block mb-0.5">
            Asset Address
          </span>
          <span className="font-normal text-foreground leading-relaxed text-sm block">
            {booking.siteAddress || 'N/A'}
          </span>
        </div>
      </div>
    </div>
  )
}

interface AssetGeometrySectionProps {
  showToal: boolean
  showEmergency: boolean
  toalMode: ReturnType<typeof import('./review-geometry-utils').toGeometryMode>
  toalPoints: [number, number][]
  emergencyMode: ReturnType<
    typeof import('./review-geometry-utils').toGeometryMode
  >
  emergencyPoints: [number, number][]
  toalRadius: number
  emergencyRadius: number
  computedToalArea: string
  computedEmergencyArea: string
}

export function AssetGeometrySection({
  showToal,
  showEmergency,
  toalMode,
  toalPoints,
  emergencyMode,
  emergencyPoints,
  toalRadius,
  emergencyRadius,
  computedToalArea,
  computedEmergencyArea,
}: AssetGeometrySectionProps) {
  if (!showToal && !showEmergency) return null

  return (
    <div className="space-y-1.5">
      <h3 className="text-base font-semibold text-primary">Asset Geometry</h3>
      <div className="bg-muted/10 rounded-lg p-3 border border-border/30 divide-y divide-border/20">
        {showToal && (
          <DetailRow
            label="TOAL Boundary"
            value={formatBoundarySummary(toalMode, toalRadius, toalPoints)}
          />
        )}
        {showToal && <DetailRow label="TOAL Area" value={computedToalArea} />}
        {showEmergency && (
          <DetailRow
            label="Emergency Boundary"
            value={formatBoundarySummary(
              emergencyMode,
              emergencyRadius,
              emergencyPoints,
            )}
          />
        )}
        {showEmergency && (
          <DetailRow label="Emergency Area" value={computedEmergencyArea} />
        )}
      </div>
    </div>
  )
}

export function OperationWindowSection({ booking }: SectionProps) {
  const startTime = new Date(booking.startTime)
  const endTime = new Date(booking.endTime)

  return (
    <div className="space-y-1.5">
      <h3 className="text-base font-semibold text-primary">Operation Window</h3>
      <div className="bg-muted/10 rounded-lg p-3 border border-border/30 divide-y divide-border/20">
        <DetailRow
          label="Start Date and Time"
          value={format(startTime, 'dd-MM-yyyy HH:mm')}
        />
        <DetailRow
          label="End Date and Time"
          value={format(endTime, 'dd-MM-yyyy HH:mm')}
        />
        <DetailRow
          label="Duration"
          value={
            <span className="font-normal">
              {Math.round(
                (endTime.getTime() - startTime.getTime()) / (1000 * 60),
              )}{' '}
              minutes
            </span>
          }
        />
      </div>
    </div>
  )
}

export function AircraftInfoSection({ booking }: SectionProps) {
  return (
    <div className="space-y-1.5">
      <h3 className="text-base font-semibold text-primary">Aircraft Info</h3>
      <div className="bg-muted/10 rounded-lg p-3 border border-border/30 divide-y divide-border/20">
        <DetailRow label="Drone Model" value={booking.droneModel || 'N/A'} />
        <DetailRow label="Manufacture" value={booking.manufacturer || 'N/A'} />
        <DetailRow label="Airframe" value={booking.airframe || 'N/A'} />
        <DetailRow
          label="Maximum Take-off Weight (MTOW)"
          value={booking.mtow || 'N/A'}
        />
      </div>
    </div>
  )
}

export function OperatorInfoSection({ booking }: SectionProps) {
  return (
    <div className="space-y-1.5">
      <h3 className="text-base font-semibold text-primary">Operator Info</h3>
      <div className="bg-muted/10 rounded-lg p-3 border border-border/30 divide-y divide-border/20">
        <DetailRow
          label="Operator Name"
          value={booking.operatorName || 'N/A'}
        />
        <DetailRow
          label="Operator Email"
          value={booking.operatorEmail || 'N/A'}
        />
        <DetailRow
          label="Operator Phone"
          value={booking.operatorPhone || 'N/A'}
        />
        <DetailRow
          label="Organisation"
          value={booking.operatorOrganisation || 'Independent'}
        />
        <DetailRow
          label="CAA Flyer ID"
          value={
            <span className="font-mono text-sm text-foreground">
              {(
                booking.operatorFlyerId ||
                booking.flyerId ||
                'PENDING'
              ).toUpperCase()}
            </span>
          }
        />
        <DetailRow
          label="CAA Operator ID"
          value={
            <span className="font-mono text-sm text-foreground">
              {(booking.operatorReference || 'PENDING').toUpperCase()}
            </span>
          }
        />
      </div>
    </div>
  )
}

export function SupportingDocumentsSection({ booking }: SectionProps) {
  if (!booking.documents?.length) {
    return (
      <div className="space-y-1.5">
        <h3 className="text-base font-semibold text-primary">
          Supporting Documents
        </h3>
        <div className="bg-muted/10 rounded-lg p-3 border border-border/30 text-sm text-muted-foreground">
          No supporting documents were provided.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <h3 className="text-base font-semibold text-primary">
        Supporting Documents
      </h3>
      <div className="bg-muted/10 rounded-lg p-3 border border-border/30 space-y-2">
        {booking.documents.map((document, index) => {
          const href = document.downloadUrl || document.fileKey
          const name =
            document.fileName ||
            document.fileKey.split('/').pop() ||
            `Document ${index + 1}`

          return (
            <a
              key={document.id || `${document.fileKey}-${index}`}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 rounded-lg border border-border/30 bg-background px-3 py-2 hover:border-primary/30 hover:bg-primary/5 transition-colors"
            >
              <span className="flex items-center gap-2 min-w-0">
                <FileText className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm font-medium text-foreground truncate">
                  {name}
                </span>
              </span>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </a>
          )
        })}
      </div>
    </div>
  )
}

export function CommercialSummarySection({ booking }: SectionProps) {
  return (
    <div className="space-y-1.5">
      <h3 className="text-base font-semibold text-primary">
        Commercial Summary
      </h3>
      <div className="bg-muted/10 rounded-lg p-3 border border-border/30 divide-y divide-border/20">
        <DetailRow
          label="Access Fee"
          value={
            <span className="font-semibold text-base text-foreground">
              £{(booking.toalCost ?? 0).toFixed(2)}
            </span>
          }
        />
        <DetailRow
          label="Payment Status"
          value={<PaymentStatusBadge booking={booking} />}
        />
      </div>
    </div>
  )
}
