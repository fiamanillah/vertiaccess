'use client'

import * as React from 'react'
import { Ticket } from '@/app/dashboard/components/incident-report/types'
import { Badge } from '@workspace/ui/components/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card'
import { Separator } from '@workspace/ui/components/separator'
import { Skeleton } from '@workspace/ui/components/skeleton'
import {
  Info,
  ExternalLink,
  User,
  Building2,
  Plane,
  ScrollText,
  Ban,
  Lock,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react'
import { cn } from '@workspace/ui/lib/utils'
import Link from 'next/link'
import { bookingService } from '@/services/booking.service'
import { format } from 'date-fns'
import { circleAreaM2, polygonAreaM2, formatArea } from '@/lib/geojson-utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip'

interface DetailRowProps {
  label: string
  value: React.ReactNode
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="font-medium text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground text-right">{value}</span>
    </div>
  )
}

// ─── Local Geometry Helper Functions ─────────────────────────────────────────

function toGeometryMode(geometry: any) {
  const geom = geometry as { type?: string } | null | undefined
  return geom?.type === 'polygon' ? 'polygon' : 'circle'
}

function toPolygonPoints(geometry: any): [number, number][] {
  if (!geometry || !Array.isArray(geometry.points)) return []
  return geometry.points
    .map((point: any): [number, number] | null => {
      if (point && typeof point === 'object' && !Array.isArray(point) &&
          typeof point.lat === 'number' && typeof point.lng === 'number') {
        return [point.lat, point.lng]
      }
      if (Array.isArray(point) && point.length >= 2 &&
          typeof point[0] === 'number' && typeof point[1] === 'number') {
        return [point[0], point[1]]
      }
      return null
    })
    .filter((p: [number, number] | null): p is [number, number] => p !== null)
}

function formatBoundarySummary(
  mode: 'circle' | 'polygon',
  radius: number,
  points: [number, number][],
) {
  if (mode === 'polygon') {
    return `Polygon - ${points.length} point${points.length === 1 ? '' : 's'} defined`
  }
  return `Circle - ${radius.toLocaleString()} m radius`
}

function getPaymentStatusBadge(b: any) {
  const isEmergency = b.useCategory === 'emergency_recovery'
  const status = b.paymentStatus

  if (isEmergency) {
    if (status === 'charged') {
      return {
        label: 'Paid',
        className: 'bg-emerald-50/10 text-emerald-700 border-emerald-200 font-medium text-xs px-2 py-0.5 shadow-none',
        tooltip: 'Payment has been successfully processed.'
      }
    }
    if (status === 'failed') {
      return {
        label: 'Failed',
        className: 'bg-red-50/10 text-red-700 border-red-200 font-medium text-xs px-2 py-0.5 shadow-none',
        tooltip: 'Emergency landing charge failed. Operator account may be locked.'
      }
    }
    return {
      label: 'Pending (Standby)',
      className: 'bg-amber-50/10 text-amber-700 border-amber-200 font-medium text-xs px-2 py-0.5 shadow-none',
      tooltip: 'Payment is pending. For emergency and recovery, funds are only captured when the site is accessed.'
    }
  } else {
    switch (status) {
      case 'charged':
        return {
          label: 'Paid',
          className: 'bg-emerald-50/10 text-emerald-700 border-emerald-200 font-medium text-xs px-2 py-0.5 shadow-none',
          tooltip: 'Payment has been successfully processed.'
        }
      case 'failed':
        return {
          label: 'Failed',
          className: 'bg-red-50/10 text-red-700 border-red-200 font-medium text-xs px-2 py-0.5 shadow-none',
          tooltip: 'The card charge attempt failed. Please check payment details.'
        }
      case 'pending_charge':
        return {
          label: 'Processing',
          className: 'bg-blue-50/10 text-blue-700 border-blue-200 font-medium text-xs px-2 py-0.5 shadow-none animate-pulse',
          tooltip: 'Payment is currently being processed.'
        }
      case 'pending':
      default:
        if (b.status === 'PENDING') {
          return {
            label: 'Pending Approval',
            className: 'bg-amber-50/10 text-amber-700 border-amber-200 font-medium text-xs px-2 py-0.5 shadow-none',
            tooltip: 'Payment is pending asset owner approval.'
          }
        }
        return {
          label: 'Pending Payment',
          className: 'bg-amber-50/10 text-amber-700 border-amber-200 font-medium text-xs px-2 py-0.5 shadow-none',
          tooltip: 'Payment is pending charge on approval.'
        }
    }
  }
}

interface CaseSidebarProps {
  ticket: Ticket
}

export function CaseSidebar({ ticket }: CaseSidebarProps) {
  const [bookingDetails, setBookingDetails] = React.useState<any>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [isOperator, setIsOperator] = React.useState(true)

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOperator(window.location.pathname.includes('/operator/'))
    }
  }, [])

  React.useEffect(() => {
    if (ticket.bookingId) {
      setIsLoading(true)
      bookingService.getBooking(ticket.bookingId)
        .then((data) => {
          if (data) {
            setBookingDetails(data)
          }
        })
        .catch((err) => {
          console.error('Error loading booking details in sidebar:', err)
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [ticket.bookingId])

  const decisionIcon =
    ticket.decision?.action === 'ban' ? (
      <Ban className="h-4 w-4 text-destructive" />
    ) : ticket.decision?.action === 'temporary_suspend' ? (
      <Lock className="h-4 w-4 text-warning" />
    ) : ticket.decision?.action === 'warning' ? (
      <ShieldAlert className="h-4 w-4 text-warning" />
    ) : (
      <CheckCircle2 className="h-4 w-4 text-primary" />
    )

  return (
    <aside className="space-y-4">
      <Card className="border shadow-none bg-background/50 backdrop-blur-xl overflow-hidden">
        {/* Accent bar at the top */}
        <div
          className={cn(
            'h-1.5 w-full',
            ticket.status === 'action_required'
              ? 'bg-destructive'
              : ticket.status === 'under_review'
              ? 'bg-warning'
              : 'bg-primary'
          )}
        />
        
        <CardHeader className="pb-4 pt-4 px-4">
          <div className="flex mb-2">
            <Badge
              variant={
                ticket.status === 'action_required'
                  ? 'destructive'
                  : ticket.status === 'under_review'
                  ? 'secondary'
                  : 'outline'
              }
              className="text-xs font-semibold h-6 px-2.5"
            >
              {ticket.status.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </Badge>
          </div>
          <CardTitle className="text-lg font-bold text-foreground">
            {ticket.reference}
          </CardTitle>
          <div className="text-xs text-muted-foreground mt-1 font-medium">
            Created at: {format(new Date(ticket.createdAt), 'dd-MM-yyyy HH:mm')}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4 p-4 pt-0">
          <Separator className="bg-border/40" />

          {/* Overview & Parties */}
          <div className="space-y-3">
            <div className="text-sm font-semibold text-primary flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" /> Overview & Parties
            </div>
            
            {ticket.decision && (
              <div className="bg-muted/30 p-3 rounded-xl border border-border/40 space-y-1">
                <div className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-2">
                  {decisionIcon}
                  <span>Decision</span>
                </div>
                <div className="text-sm font-semibold text-foreground">
                  {ticket.decision.action.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {ticket.decision.reason}
                </p>
              </div>
            )}

            <div className="grid gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Plane className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium text-muted-foreground leading-none mb-0.5">Operator</div>
                  <div className="text-sm font-semibold text-foreground truncate">{ticket.operatorName || 'Unknown'}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium text-muted-foreground leading-none mb-0.5">Asset Manager</div>
                  <div className="text-sm font-semibold text-foreground truncate">{ticket.assetManagerName || 'Unknown'}</div>
                </div>
              </div>
            </div>
          </div>

          {ticket.bookingId && (
            <>
              <Separator className="bg-border/40" />

              {/* Operation Details */}
              <div className="space-y-3">
                <div className="text-sm font-semibold text-primary flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5" /> Operation Details
                </div>

                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                ) : bookingDetails ? (
                  <div className="space-y-4">
                    {/* Request Details */}
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Request Details</h4>
                      <div className="bg-muted/10 rounded-lg p-3 border border-border/30 divide-y divide-border/20">
                        <DetailRow
                          label="Request ID"
                          value={
                            <span className="font-mono text-xs text-foreground">
                              {(bookingDetails.bookingReference || bookingDetails.vaId || 'N/A').toUpperCase()}
                            </span>
                          }
                        />
                        <DetailRow
                          label="Capability Requested"
                          value={
                            <Badge
                              className={
                                bookingDetails.useCategory === 'planned_toal'
                                  ? 'bg-indigo-500 hover:bg-indigo-600 font-medium text-[10px] px-1.5 py-0.5 text-white shadow-none'
                                  : 'bg-amber-500 hover:bg-amber-600 font-medium text-[10px] px-1.5 py-0.5 text-white shadow-none'
                              }
                            >
                              {bookingDetails.useCategory === 'planned_toal'
                                ? 'TOAL'
                                : 'Emergency Recovery'}
                            </Badge>
                          }
                        />
                        <div className="py-2 text-xs">
                          <span className="text-xs font-medium text-muted-foreground block mb-0.5">
                            Operational Intent
                          </span>
                          <span className="font-normal text-foreground italic leading-relaxed block">
                            "{bookingDetails.missionIntent || 'No operational intent description provided.'}"
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Asset Information */}
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Asset Information</h4>
                      <div className="bg-muted/10 rounded-lg p-3 border border-border/30 divide-y divide-border/20">
                        <DetailRow
                          label="Asset Name"
                          value={bookingDetails.siteName || 'N/A'}
                        />
                        <DetailRow
                          label="Asset ID"
                          value={
                            <span className="font-mono text-xs text-foreground">
                              {(bookingDetails.siteVaId || 'N/A').toUpperCase()}
                            </span>
                          }
                        />
                        <DetailRow
                          label="Asset Type"
                          value={
                            bookingDetails.siteCategory
                              ? bookingDetails.siteCategory
                                  .split('_')
                                  .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                                  .join(' ')
                              : 'N/A'
                          }
                        />
                        <div className="py-2 text-xs">
                          <span className="text-xs font-medium text-muted-foreground block mb-0.5">
                            Asset Address
                          </span>
                          <span className="font-normal text-foreground leading-relaxed block">
                            {bookingDetails.siteAddress || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Asset Geometry */}
                    {(() => {
                      const showToal =
                        bookingDetails.useCategory === 'planned_toal' ||
                        bookingDetails.useCategory === 'both' ||
                        !bookingDetails.useCategory
                      const showEmergency =
                        (bookingDetails.useCategory === 'emergency_recovery' ||
                          bookingDetails.useCategory === 'both' ||
                          !bookingDetails.useCategory) &&
                        Boolean(bookingDetails.siteClzGeometry)

                      if (!showToal && !showEmergency) return null

                      const toalMode = toGeometryMode(bookingDetails.siteGeometry)
                      const toalPoints = toPolygonPoints(bookingDetails.siteGeometry)
                      const emergencyMode = toGeometryMode(bookingDetails.siteClzGeometry)
                      const emergencyPoints = toPolygonPoints(bookingDetails.siteClzGeometry)
                      const toalRadius = (bookingDetails.siteGeometry as any)?.radius ?? 150
                      const emergencyRadius = (bookingDetails.siteClzGeometry as any)?.radius ?? 300

                      const computedToalArea = toalMode === 'polygon'
                        ? formatArea(polygonAreaM2(toalPoints))
                        : formatArea(circleAreaM2(toalRadius))

                      const computedEmergencyArea = emergencyMode === 'polygon'
                        ? formatArea(polygonAreaM2(emergencyPoints))
                        : formatArea(circleAreaM2(emergencyRadius))

                      return (
                        <div className="space-y-1.5">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Asset Geometry</h4>
                          <div className="bg-muted/10 rounded-lg p-3 border border-border/30 divide-y divide-border/20">
                            {showToal && (
                              <DetailRow
                                label="TOAL Boundary"
                                value={formatBoundarySummary(toalMode, toalRadius, toalPoints)}
                              />
                            )}
                            {showToal && (
                              <DetailRow
                                label="TOAL Area"
                                value={computedToalArea}
                              />
                            )}
                            {showEmergency && (
                              <DetailRow
                                label="Emergency Boundary"
                                value={formatBoundarySummary(emergencyMode, emergencyRadius, emergencyPoints)}
                              />
                            )}
                            {showEmergency && (
                              <DetailRow
                                label="Emergency Area"
                                value={computedEmergencyArea}
                              />
                            )}
                          </div>
                        </div>
                      )
                    })()}

                    {/* Operation Window */}
                    {(() => {
                      const startTime = new Date(bookingDetails.startTime)
                      const endTime = new Date(bookingDetails.endTime)
                      const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))
                      return (
                        <div className="space-y-1.5">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Operation Window</h4>
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
                              value={<span className="font-normal">{duration} minutes</span>}
                            />
                          </div>
                        </div>
                      )
                    })()}

                    {/* Aircraft Info */}
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Aircraft Info</h4>
                      <div className="bg-muted/10 rounded-lg p-3 border border-border/30 divide-y divide-border/20">
                        <DetailRow
                          label="Drone Model"
                          value={bookingDetails.droneModel || 'N/A'}
                        />
                        <DetailRow
                          label="Manufacture"
                          value={bookingDetails.manufacturer || 'N/A'}
                        />
                        <DetailRow
                          label="Airframe"
                          value={bookingDetails.airframe || 'N/A'}
                        />
                        <DetailRow
                          label="Maximum Take-off Weight (MTOW)"
                          value={bookingDetails.mtow || 'N/A'}
                        />
                      </div>
                    </div>

                    {/* Operator Info */}
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Operator Info</h4>
                      <div className="bg-muted/10 rounded-lg p-3 border border-border/30 divide-y divide-border/20">
                        <DetailRow
                          label="Operator Name"
                          value={bookingDetails.operatorName || 'N/A'}
                        />
                        <DetailRow
                          label="Operator Email"
                          value={bookingDetails.operatorEmail || 'N/A'}
                        />
                        <DetailRow
                          label="Operator Phone"
                          value={bookingDetails.operatorPhone || 'N/A'}
                        />
                        <DetailRow
                          label="Organisation"
                          value={bookingDetails.operatorOrganisation || 'Independent'}
                        />
                        <DetailRow
                          label="CAA Flyer ID"
                          value={
                            <span className="font-mono text-xs text-foreground">
                              {(bookingDetails.operatorFlyerId || bookingDetails.flyerId || 'PENDING').toUpperCase()}
                            </span>
                          }
                        />
                        <DetailRow
                          label="CAA Operator ID"
                          value={
                            <span className="font-mono text-xs text-foreground">
                              {(bookingDetails.operatorReference || 'PENDING').toUpperCase()}
                            </span>
                          }
                        />
                      </div>
                    </div>

                    {/* Commercial Summary */}
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Commercial Summary</h4>
                      <div className="bg-muted/10 rounded-lg p-3 border border-border/30 divide-y divide-border/20">
                        <DetailRow
                          label="Access Fee"
                          value={
                            <span className="font-semibold text-sm text-foreground">
                              £{(bookingDetails.toalCost ?? 0).toFixed(2)}
                            </span>
                          }
                        />
                        <DetailRow
                          label="Payment Status"
                          value={
                            (() => {
                              const badgeInfo = getPaymentStatusBadge(bookingDetails)
                              return (
                                <div className="flex items-center gap-1.5 justify-end">
                                  <Badge className={badgeInfo.className}>
                                    {badgeInfo.label}
                                  </Badge>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-pointer shrink-0" />
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="max-w-[240px] text-center bg-popover text-popover-foreground border">
                                        <p className="text-xs">
                                          {badgeInfo.tooltip}
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              )
                            })()
                          }
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <Link
                        href={
                          isOperator
                            ? `/dashboard/operator/bookings/${ticket.bookingId}`
                            : `/dashboard/assetmanager/scheduler/${ticket.bookingId}/review`
                        }
                        className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                      >
                        View Full Request <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground italic">Operation details unavailable.</div>
                )}
              </div>
            </>
          )}

          <Separator className="bg-border/40" />

          <div className="flex items-center gap-2 rounded-lg bg-muted/40 border border-border/40 p-3 text-muted-foreground">
            <ScrollText className="h-4 w-4 shrink-0" />
            <p className="text-xs font-medium leading-tight">
              This investigation is mediated by the VertiAccess Safety Team. All decisions are final.
            </p>
          </div>
        </CardContent>
      </Card>
    </aside>
  )
}

