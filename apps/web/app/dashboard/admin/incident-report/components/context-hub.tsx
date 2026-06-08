'use client'

import * as React from 'react'
import {
  Ticket,
  PartyProfile,
  IncidentDecisionAction,
} from '@/app/dashboard/components/incident-report/types'
import { Button } from '@workspace/ui/components/button'
import { Badge } from '@workspace/ui/components/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'
import { Separator } from '@workspace/ui/components/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select'
import { Input } from '@workspace/ui/components/input'
import { Textarea } from '@workspace/ui/components/textarea'
import { Label } from '@workspace/ui/components/label'
import {
  MapPin,
  User,
  CreditCard,
  ShieldAlert,
  Lock,
  Ban,
  Loader2,
  FileText,
  AlertTriangle
} from 'lucide-react'
import { incidentService } from '@/services/incident.service'
import { mapIncidentToTicket } from '@/services/incident.types'
import { toast } from 'sonner'
import { cn } from '@workspace/ui/lib/utils'
import { bookingService } from '@/services/booking.service'
import { format } from 'date-fns'
import { circleAreaM2, polygonAreaM2, formatArea } from '@/lib/geojson-utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { Info } from 'lucide-react'

interface ContextHubProps {
  ticket: Ticket
  onTicketUpdate: (ticket: Ticket) => void
}

function resolveDecisionTargetId(
  ticket: Ticket,
  role: 'operator' | 'assetmanager',
) {
  if (role === ticket.reporterRole) return ticket.reporterId
  if (role === ticket.targetRole) return ticket.targetId
  return role === 'operator' ? ticket.reporterId : ticket.targetId
}

function getPriorityColor(priority: string) {
  switch (priority?.toLowerCase()) {
    case 'critical': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800'
    case 'high': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800'
    case 'medium': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800'
    default: return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800'
  }
}

// ─── Local DetailRow component ────────────────────────────────────────────────

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

export function ContextHub({ ticket, onTicketUpdate }: ContextHubProps) {
  const [currentStatus, setCurrentStatus] = React.useState(ticket.status)
  const [currentPriority, setCurrentPriority] = React.useState(ticket.priority)
  const [activeUpdate, setActiveUpdate] = React.useState<
    'details' | 'decision' | null
  >(null)
  const [decisionAction, setDecisionAction] =
    React.useState<IncidentDecisionAction>('no_action')
  const [decisionTargetRole, setDecisionTargetRole] = React.useState<
    'operator' | 'assetmanager'
  >(ticket.reporterRole === 'operator' ? 'assetmanager' : 'operator')
  const [decisionReason, setDecisionReason] = React.useState('')
  const [decisionDurationDays, setDecisionDurationDays] = React.useState('7')
  const [bookingDetails, setBookingDetails] = React.useState<any>(null)
  const [isBookingLoading, setIsBookingLoading] = React.useState(false)

  React.useEffect(() => {
    if (ticket.bookingId) {
      setIsBookingLoading(true)
      bookingService.getBooking(ticket.bookingId)
        .then((data) => {
          if (data) setBookingDetails(data)
        })
        .catch((err) => console.error('Error loading booking in admin context hub:', err))
        .finally(() => setIsBookingLoading(false))
    } else {
      setBookingDetails(null)
    }
  }, [ticket.bookingId])

  const reporterProfile = ticket.reporterProfile ?? {
    id: ticket.reporterId,
    name: ticket.operatorName || 'Unknown Operator',
    email: 'Unknown',
    phone: 'Unknown',
    role: (ticket.reporterRole === 'assetmanager' ? 'assetmanager' : 'operator') as
      | 'operator'
      | 'assetmanager',
  }

  const targetProfile = ticket.targetProfile ?? {
    id: ticket.targetId || 'unknown',
    name: ticket.assetManagerName || 'Unknown Asset Manager',
    email: 'Unknown',
    phone: 'Unknown',
    role: (ticket.targetRole === 'operator' ? 'operator' : 'assetmanager') as
      | 'operator'
      | 'assetmanager',
  }

  React.useEffect(() => {
    setCurrentStatus(ticket.status)
    setCurrentPriority(ticket.priority)
    setDecisionAction(
      ticket.decision?.action === 'warning'
        ? 'no_action'
        : (ticket.decision?.action ?? 'no_action'),
    )
    setDecisionTargetRole(
      ticket.decision?.targetRole ??
        (ticket.reporterRole === 'operator' ? 'assetmanager' : 'operator'),
    )
    setDecisionReason(ticket.decision?.reason ?? '')
    setDecisionDurationDays(
      ticket.decision?.durationDays
        ? String(ticket.decision.durationDays)
        : '7',
    )
  }, [ticket])

  const updateCaseDetails = async () => {
    setActiveUpdate('details')
    try {
      const backendStatus =
        currentStatus === 'under_review'
          ? 'UNDER_REVIEW'
          : currentStatus === 'resolved'
            ? 'RESOLVED'
            : 'OPEN'
      const updated = await incidentService.updateIncidentStatus(ticket.id, {
        status: backendStatus,
        urgency: currentPriority as any,
      })
      onTicketUpdate(mapIncidentToTicket(updated))
      toast.success('Case details updated successfully')
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update case details')
    } finally {
      setActiveUpdate(null)
    }
  }

  const handleDecisionSubmit = async () => {
    if (!decisionReason.trim()) {
      toast.error('Please provide a decision reason.')
      return
    }

    const targetId =
      decisionAction === 'no_action'
        ? null
        : resolveDecisionTargetId(ticket, decisionTargetRole)

    if (decisionAction !== 'no_action' && !targetId) {
      toast.error('Please choose a valid decision target.')
      return
    }

    setActiveUpdate('decision')
    try {
      const updated = await incidentService.recordDecision(ticket.id, {
        decisionAction: decisionAction as 'no_action' | 'temporary_suspend' | 'ban',
        decisionReason,
        decisionTargetId: targetId,
        decisionTargetRole:
          decisionAction === 'no_action' ? null : decisionTargetRole,
        decisionDurationDays:
          decisionAction === 'temporary_suspend'
            ? Number(decisionDurationDays) || null
            : null,
      })
      onTicketUpdate(mapIncidentToTicket(updated))
      toast.success('Incident decision recorded')
    } catch (error: any) {
      toast.error(error?.message || 'Failed to record decision')
    } finally {
      setActiveUpdate(null)
    }
  }

  return (
    <Card className="border-border/50 shadow-sm flex flex-col w-full h-full animate-in fade-in slide-in-from-right-4 duration-500 overflow-hidden">
      <CardHeader className="bg-muted/10 border-b border-border/50 p-4 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold text-primary flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Incident Details
          </CardTitle>
          <Badge variant="outline" className="font-mono text-[10px] bg-background">
            {ticket.reference}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-0">
        <div className="p-4 space-y-6">
          
          {/* Initial Report Summary */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5" />
              Reporter Summary
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-muted-foreground">Category</Label>
                  <p className="text-sm font-bold capitalize">{ticket.category.replace(/_/g, ' ')}</p>
                </div>
                <div className="space-y-1 text-right">
                  <Label className="text-xs font-semibold text-muted-foreground block">Severity</Label>
                  <Badge variant="outline" className={cn("capitalize text-xs px-2 py-0", getPriorityColor(ticket.priority))}>
                    {ticket.priority}
                  </Badge>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-muted-foreground">Description</Label>
                <p className="text-sm text-foreground leading-relaxed">
                  {ticket.description}
                </p>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-muted-foreground block mb-1">Impacts</Label>
                {ticket.impactAssessment && ticket.impactAssessment.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {ticket.impactAssessment.map((impact) => (
                      <Badge key={impact} variant="secondary" className="bg-muted/50 text-xs font-medium border-border/40">
                        {impact}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">None</p>
                )}
              </div>

              {ticket.siteName && (
                <div className="flex items-center gap-1.5 pt-1">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">{ticket.siteName}</span>
                </div>
              )}
            </div>
          </section>

          <Separator className="bg-border/40" />

          {/* Operation Details */}
          {ticket.bookingId && (
            <>
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
                  <Info className="h-3.5 w-3.5" />
                  Operation Details
                </h3>
                {isBookingLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
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
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground italic">Operation details unavailable.</div>
                )}
              </section>

              <Separator className="bg-border/40" />
            </>
          )}

          {/* Involved Parties */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
              <User className="h-3.5 w-3.5" />
              Parties
            </h3>
            <div className="flex flex-col gap-2">
              <PartyRow profile={reporterProfile} label="Reporter" role={ticket.reporterRole ?? 'operator'} />
              <PartyRow profile={targetProfile} label="Target" role={ticket.targetRole ?? 'assetmanager'} />
            </div>
          </section>

          <Separator className="bg-border/40" />

          {/* Case Management */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="h-3.5 w-3.5" />
              Management
            </h3>
            <div className="flex gap-3">
              <div className="flex-1 space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Status</Label>
                <Select
                  value={currentStatus}
                  onValueChange={(value) => setCurrentStatus(value as typeof currentStatus)}
                  disabled={activeUpdate !== null}
                >
                  <SelectTrigger className="h-8 text-xs bg-muted/10 border-border/50">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="action_required">Action Required</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Priority</Label>
                <Select
                  value={currentPriority}
                  onValueChange={(value) => setCurrentPriority(value as typeof currentPriority)}
                  disabled={activeUpdate !== null}
                >
                  <SelectTrigger className="h-8 text-xs bg-muted/10 border-border/50">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              className="w-full h-8 text-xs font-semibold mt-1"
              variant="outline"
              onClick={() => void updateCaseDetails()}
              disabled={activeUpdate === 'details'}
            >
              {activeUpdate === 'details' ? (
                <><Loader2 className="h-3 w-3 animate-spin mr-2" /> Updating...</>
              ) : (
                'Update Case'
              )}
            </Button>
          </section>

          <Separator className="bg-border/40" />

          {/* Final Decision */}
          <section className="space-y-3 pb-2">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="h-3.5 w-3.5" />
              Decision
            </h3>
            
            {ticket.decision && (
              <div className="border-l-2 border-primary pl-3 py-1 space-y-1 mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-primary">
                    {ticket.decision.action.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">
                    by {ticket.decision.decidedBy || 'Admin'}
                  </span>
                </div>
                <p className="text-sm font-medium text-foreground">
                  {ticket.decision.reason}
                </p>
                {ticket.decision.durationDays && (
                  <p className="text-xs font-medium text-muted-foreground">
                    Duration: {ticket.decision.durationDays} days
                  </p>
                )}
              </div>
            )}

            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Action</Label>
                  <Select
                    value={decisionAction}
                    onValueChange={(value) => setDecisionAction(value as IncidentDecisionAction)}
                    disabled={activeUpdate === 'decision'}
                  >
                    <SelectTrigger className="h-8 text-xs bg-muted/10 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no_action">No Action</SelectItem>
                      <SelectItem value="temporary_suspend">Temporary Suspend</SelectItem>
                      <SelectItem value="ban">Ban</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Target</Label>
                  <Select
                    value={decisionTargetRole}
                    onValueChange={(value) => setDecisionTargetRole(value as 'operator' | 'assetmanager')}
                    disabled={activeUpdate === 'decision'}
                  >
                    <SelectTrigger className="h-8 text-xs bg-muted/10 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operator">Operator</SelectItem>
                      <SelectItem value="assetmanager">Asset Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {decisionAction === 'temporary_suspend' && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Duration (Days)</Label>
                  <Input
                    type="number"
                    min="1"
                    className="h-8 text-xs bg-muted/10 border-border/50"
                    value={decisionDurationDays}
                    onChange={(e) => setDecisionDurationDays(e.target.value)}
                    disabled={activeUpdate === 'decision'}
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Reasoning</Label>
                <Textarea
                  placeholder="Sanction rationale..."
                  className="min-h-[60px] resize-none text-xs bg-muted/10 border-border/50 p-2"
                  value={decisionReason}
                  onChange={(e) => setDecisionReason(e.target.value)}
                  disabled={activeUpdate === 'decision'}
                />
              </div>

              <Button
                size="sm"
                className={cn(
                  'w-full h-8 text-xs font-semibold',
                  decisionAction === 'ban' ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' : ''
                )}
                onClick={() => void handleDecisionSubmit()}
                disabled={activeUpdate === 'decision'}
              >
                {activeUpdate === 'decision' ? (
                  <><Loader2 className="h-3 w-3 animate-spin mr-2" /> Recording...</>
                ) : (
                  <>
                    {decisionAction === 'ban' ? <Ban className="h-3 w-3 mr-1.5" /> : <Lock className="h-3 w-3 mr-1.5" />}
                    Record Decision
                  </>
                )}
              </Button>
            </div>
          </section>
        </div>
      </CardContent>
    </Card>
  )
}

function PartyRow({
  profile,
  label,
  role
}: {
  profile: PartyProfile
  label: string
  role: string
}) {
  return (
    <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/10 border border-transparent hover:border-border/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <User className="h-4 w-4 text-primary" />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm truncate leading-none">{profile.name}</span>
            <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded leading-tight">
              {label}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
