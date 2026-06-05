'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, ShieldAlert, Info } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import { Badge } from '@workspace/ui/components/badge'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { Separator } from '@workspace/ui/components/separator'
import { PreviewMap } from '@/components/map/preview-map'
import { RejectionModal } from '../../components/rejection-modal'
import { bookingService } from '@/services/booking.service'
import { Booking } from '../../types'
import { circleAreaM2, polygonAreaM2, formatArea } from '@/lib/geojson-utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog'

// ─── Local Geometry Helper Functions ─────────────────────────────────────────

function toGeometryMode(geometry: any) {
  const geom = geometry as { type?: string } | null | undefined
  return geom?.type === 'polygon' ? 'polygon' : 'circle'
}

function toGeometryCenter(geometry: any) {
  const geom = geometry as
    | { center?: { lat?: number; lng?: number } | null; points?: any[] | null }
    | null
    | undefined
  const center = geom?.center
  if (
    center &&
    typeof center.lat === 'number' &&
    typeof center.lng === 'number'
  ) {
    return { lat: center.lat, lng: center.lng }
  }

  if (Array.isArray(geom?.points) && geom.points.length > 0) {
    const point = geom.points[0]
    // Handle { lat, lng } object format (from backend)
    if (point && typeof point === 'object' && !Array.isArray(point) &&
        typeof point.lat === 'number' && typeof point.lng === 'number') {
      return { lat: point.lat, lng: point.lng }
    }
    // Handle [lat, lng] tuple format (legacy)
    if (Array.isArray(point) && point.length >= 2) {
      const latVal = point[0]
      const lngVal = point[1]
      return { lat: Number(latVal) || 51.505, lng: Number(lngVal) || -0.09 }
    }
  }

  return { lat: 51.505, lng: -0.09 }
}

function toPolygonPoints(geometry: any): [number, number][] {
  if (!geometry || !Array.isArray(geometry.points)) return []
  return geometry.points
    .map((point: any): [number, number] | null => {
      // Handle { lat, lng } object format (from backend)
      if (point && typeof point === 'object' && !Array.isArray(point) &&
          typeof point.lat === 'number' && typeof point.lng === 'number') {
        return [point.lat, point.lng]
      }
      // Handle [lat, lng] tuple format (legacy)
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

// ─── Detail row item component ────────────────────────────────────────────────

interface DetailRowProps {
  label: string
  value: React.ReactNode
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <span className="font-medium text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground text-right">{value}</span>
    </div>
  )
}

// ─── Main Review Page Component ──────────────────────────────────────────────

export default function LandownerOperationReviewPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params?.id ?? ''

  const [booking, setBooking] = React.useState<Booking | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isActionSubmitting, setIsActionSubmitting] = React.useState(false)
  const [isRejectionModalOpen, setIsRejectionModalOpen] = React.useState(false)
  const [isPaymentIssueModalOpen, setIsPaymentIssueModalOpen] = React.useState(false)

  const getPaymentStatusBadge = (b: Booking) => {
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
        tooltip: 'Payment is pending. For emergency standby, funds are only captured when the site is accessed.'
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
              tooltip: 'Payment is pending landowner approval.'
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

  const loadBooking = React.useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    try {
      const data = await bookingService.getBooking(id)
      setBooking(data)
    } catch (err) {
      console.error('Failed to load booking details', err)
      toast.error('Failed to load access request details')
      router.push('/dashboard/landowner/scheduler')
    } finally {
      setIsLoading(false)
    }
  }, [id, router])

  React.useEffect(() => {
    void loadBooking()
  }, [loadBooking])

  // Approve action
  const handleApprove = async () => {
    if (!booking) return
    setIsActionSubmitting(true)
    try {
      await bookingService.updateBookingStatus(booking.id, 'APPROVED')
      toast.success('Operation approved successfully')
      router.push('/dashboard/landowner/scheduler')
    } catch (value) {
      const msg =
        value instanceof Error ? value.message : 'Failed to approve booking'
      const isPaymentError =
        msg.toLowerCase().includes('payment') ||
        msg.toLowerCase().includes('card') ||
        msg.toLowerCase().includes('payment method') ||
        (value && typeof value === 'object' && 'code' in value && (value as any).code === 'APPROVAL_PAYMENT_FAILED')
      
      if (isPaymentError) {
        setIsPaymentIssueModalOpen(true)
        void loadBooking()
      } else {
        toast.error(msg)
      }
    } finally {
      setIsActionSubmitting(false)
    }
  }

  // Reject action
  const handleRejectClick = () => {
    setIsRejectionModalOpen(true)
  }

  const handleConfirmReject = async (reason: string) => {
    if (!booking) return
    setIsActionSubmitting(true)
    try {
      await bookingService.updateBookingStatus(booking.id, 'REJECTED', reason)
      toast.info('Operation declined.')
      setIsRejectionModalOpen(false)
      router.push('/dashboard/landowner/scheduler')
    } catch (value) {
      toast.error(
        value instanceof Error ? value.message : 'Failed to decline booking',
      )
    } finally {
      setIsActionSubmitting(false)
    }
  }

  // Loading Skeleton
  if (isLoading) {
    return (
      <div className="flex flex-col h-[calc(100vh-60px)] w-full">
        <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border/40 bg-background shrink-0">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-6 w-28 rounded-full" />
        </div>
        <div className="flex flex-1 overflow-hidden">
          <div className="w-[60%] h-full relative">
            <Skeleton className="w-full h-full" />
          </div>
          <div className="w-[40%] h-full border-l border-border/40 p-5 space-y-6">
            <Skeleton className="h-8 w-48" />
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!booking) return null

  // Geometry calculations for map
  const showToal = booking.useCategory === 'planned_toal' || (booking.useCategory as string) === 'both' || !booking.useCategory
  const showEmergency = (booking.useCategory === 'emergency_recovery' || (booking.useCategory as string) === 'both' || !booking.useCategory) && Boolean(booking.siteClzGeometry)

  // Use emergency geometry center if only emergency is requested and emergency geometry is present
  const mapCenter = toGeometryCenter(
    booking.useCategory === 'emergency_recovery' && booking.siteClzGeometry
      ? booking.siteClzGeometry
      : booking.siteGeometry
  )
  const toalMode = toGeometryMode(booking.siteGeometry)
  const toalPoints = toPolygonPoints(booking.siteGeometry)
  const emergencyMode = toGeometryMode(booking.siteClzGeometry)
  const emergencyPoints = toPolygonPoints(booking.siteClzGeometry)
  const toalRadius = (booking.siteGeometry as any)?.radius ?? 100
  const emergencyRadius = (booking.siteClzGeometry as any)?.radius ?? 0

  const computedToalArea = toalMode === 'polygon'
    ? formatArea(polygonAreaM2(toalPoints))
    : formatArea(circleAreaM2(toalRadius))

  const computedEmergencyArea = emergencyMode === 'polygon'
    ? formatArea(polygonAreaM2(emergencyPoints))
    : formatArea(circleAreaM2(emergencyRadius))

  const startTime = new Date(booking.startTime)
  const endTime = new Date(booking.endTime)

  return (
    <div className="flex flex-col h-[calc(100vh-60px)] w-full animate-fade-in">
      {/* Top Bar / Header breadcrumb bar */}
      <div className="flex items-center justify-between gap-4 px-4 md:px-6 py-3 border-b border-border/40 bg-background/95 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-muted-foreground hover:text-foreground shrink-0"
            onClick={() => router.push('/dashboard/landowner/scheduler')}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-xs font-bold">Back</span>
          </Button>
          <Separator orientation="vertical" className="h-8" />
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
              <span className="font-mono text-foreground">
                {booking.bookingReference ?? booking.vaId}
              </span>
            </div>
            <h1 className="text-sm font-bold tracking-tight text-foreground truncate max-w-[300px]">
              Review Request: {booking.siteName}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge
            variant="outline"
            className="text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 border-primary/20 text-primary bg-primary/5 h-5 hidden sm:inline-flex"
          >
            {booking.bookingReference ?? booking.vaId}
          </Badge>
          <Badge
            className={`text-[9px] uppercase tracking-widest border-none font-bold h-5 px-2 ${
              booking.status === 'PENDING'
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'
                : booking.status === 'APPROVED'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300'
            }`}
          >
            {booking.status}
          </Badge>
        </div>
      </div>

      {/* Style overrides for Leaflet PreviewMap nesting - square corners, no border */}
      <style>{`
        .review-map-container .leaflet-container {
          height: 100% !important;
          min-height: 100% !important;
          border-radius: 0px !important;
        }
        .review-map-container > div {
          height: 100% !important;
          min-height: 100% !important;
          border: none !important;
          border-radius: 0px !important;
          box-shadow: none !important;
        }
      `}</style>

      {/* Main content body — split 60/40 */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto lg:overflow-hidden min-h-0 w-full">
        {/* Left Side: Map only (60% width on Desktop, fixed 350px height on Mobile) */}
        <div className="w-full lg:w-[60%] h-[350px] lg:h-full relative review-map-container shrink-0 bg-muted/20">
          <PreviewMap
            center={mapCenter}
            toalRadius={toalRadius}
            emergencyRadius={emergencyRadius}
            showEmergency={showEmergency}
            showToal={showToal}
            toalMode={toalMode}
            emergencyMode={emergencyMode}
            initialToalPolygonPoints={toalPoints}
            initialEmergencyPolygonPoints={emergencyPoints}
            className="w-full h-full"
          />
        </div>

        {/* Right Side: Scrollable details panel (40% width on Desktop, scrollable) */}
        <div className="w-full lg:w-[40%] h-auto lg:h-full flex flex-col border-t lg:border-t-0 lg:border-l border-border/40 bg-background min-h-0 shrink-0 lg:shrink">
          {/* Header area of details panel */}
          <div className="px-4.5 py-3 border-b border-border/40 bg-muted/10 shrink-0">
            <div className="text-sm font-semibold text-muted-foreground">
              Infrastructure
            </div>
            <h2 className="text-xl font-bold tracking-tight text-foreground mt-0.5">
              Access Request Details
            </h2>
          </div>

          {/* Scrollable details contents */}
          <div className="flex-1 overflow-y-auto p-4.5 space-y-4 custom-scrollbar text-foreground">
            {/* Request Details Section */}
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

            {/* Asset Information Section */}
            <div className="space-y-1.5">
              <h3 className="text-base font-semibold text-primary">
                Asset Information
              </h3>
              <div className="bg-muted/10 rounded-lg p-3 border border-border/30 divide-y divide-border/20">
                <DetailRow
                  label="Asset Name"
                  value={booking.siteName || 'N/A'}
                />
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
                          .map(
                            (w: string) =>
                              w.charAt(0).toUpperCase() + w.slice(1),
                          )
                          .join(' ')
                      : 'N/A'
                  }
                />
                <DetailRow
                  label="Asset Status"
                  value={
                    <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {booking.siteStatus
                        ? booking.siteStatus.charAt(0).toUpperCase() +
                          booking.siteStatus.slice(1).toLowerCase()
                        : 'Active'}
                    </span>
                  }
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

            {/* Asset Geometry Section */}
            {(showToal || showEmergency) && (
              <div className="space-y-1.5">
                <h3 className="text-base font-semibold text-primary">
                  Asset Geometry
                </h3>
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
            )}

            {/* Operation Window Section */}
            <div className="space-y-1.5">
              <h3 className="text-base font-semibold text-primary">
                Operation Window
              </h3>
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

            {/* Aircraft Info Section */}
            <div className="space-y-1.5">
              <h3 className="text-base font-semibold text-primary">
                Aircraft Info
              </h3>
              <div className="bg-muted/10 rounded-lg p-3 border border-border/30 divide-y divide-border/20">
                <DetailRow
                  label="Drone Model"
                  value={booking.droneModel || 'N/A'}
                />
                <DetailRow
                  label="Manufacture"
                  value={booking.manufacturer || 'N/A'}
                />
                <DetailRow label="Airframe" value={booking.airframe || 'N/A'} />
                <DetailRow
                  label="Maximum Take-off Weight (MTOW)"
                  value={booking.mtow || 'N/A'}
                />
              </div>
            </div>

            {/* Operator Info Section */}
            <div className="space-y-1.5">
              <h3 className="text-base font-semibold text-primary">
                Operator Info
              </h3>
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

            {/* Commercial Summary Section */}
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
                  value={
                    (() => {
                      const badgeInfo = getPaymentStatusBadge(booking)
                      return (
                        <div className="flex items-center gap-1.5 justify-end">
                          <Badge className={badgeInfo.className}>
                            {badgeInfo.label}
                          </Badge>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-pointer" />
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-[240px] text-center">
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

          {/* Sticky action footer at the bottom of the details column */}
          {(booking.status === 'PENDING' || booking.status === 'APPROVED') && (
            <div className="p-2 border-t border-border/40 bg-muted/10 shrink-0 flex flex-col gap-3">
              {booking.status === 'PENDING' ? (
                <div className="grid grid-cols-2 gap-3 w-full">
                  <Button
                    variant="destructive"
                    onClick={handleRejectClick}
                    disabled={isActionSubmitting}
                  >
                    Decline
                  </Button>
                  <Button
                    variant="default"
                    onClick={handleApprove}
                    disabled={isActionSubmitting}
                  >
                    {isActionSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Approve...
                      </>
                    ) : (
                      'Approve Access'
                    )}
                  </Button>
                </div>
              ) : (
                <div className="text-center py-2 space-y-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs font-semibold h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/20 border border-transparent gap-2"
                    onClick={() => router.push(`/dashboard/landowner/incident-report/new?bookingId=${booking.id}&siteId=${booking.siteId}`)}
                  >
                    <ShieldAlert className="h-4 w-4" />
                    Report an Issue
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <RejectionModal
        isOpen={isRejectionModalOpen}
        onClose={() => setIsRejectionModalOpen(false)}
        onConfirm={handleConfirmReject}
        isSubmitting={isActionSubmitting}
      />

      <Dialog open={isPaymentIssueModalOpen} onOpenChange={setIsPaymentIssueModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive mb-2">
              <ShieldAlert className="h-5 w-5" />
              <DialogTitle>Approval Blocked: Payment Issue</DialogTitle>
            </div>
            <DialogDescription className="text-sm text-muted-foreground">
              The operator could not be charged for this access request. We have sent a notification to the operator asking them to add or update their payment method.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <p className="text-sm font-semibold text-foreground">
              What would you like to do?
            </p>
            <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-2">
              <li>
                <strong>Wait and Try Later</strong>: Keep the request pending. You can try approving again once the operator updates their payment method.
              </li>
              <li>
                <strong>Decline Request</strong>: Reject this request immediately due to the payment issue. The operator will see the decline reason.
              </li>
            </ul>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setIsPaymentIssueModalOpen(false)}
            >
              Wait and Try Later
            </Button>
            <Button
              variant="destructive"
              className="w-full sm:w-auto font-semibold"
              onClick={() => {
                setIsPaymentIssueModalOpen(false);
                setIsRejectionModalOpen(true);
              }}
            >
              Decline Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
