'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, AlertCircle, RotateCcw, ShieldAlert } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import { Badge } from '@workspace/ui/components/badge'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { Separator } from '@workspace/ui/components/separator'
import { PreviewMap } from '@/components/map/preview-map'
import { CancellationModal } from '../components/cancellation-modal'
import { bookingService } from '@/services/booking.service'
import { Booking } from '../types'

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
  return geometry.points.filter(
    (point: any): point is [number, number] =>
      Array.isArray(point) &&
      point.length >= 2 &&
      typeof point[0] === 'number' &&
      typeof point[1] === 'number',
  )
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

// ─── Main Operator Booking Details Page Component ────────────────────────────

export default function OperatorBookingDetailsPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params?.id ?? ''

  const [booking, setBooking] = React.useState<Booking | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isCancelModalOpen, setIsCancelModalOpen] = React.useState(false)

  const loadBooking = React.useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    try {
      // Get operator booking by ID (we can list all landowner/my bookings and find this one)
      const data = await bookingService.getBooking(id)
      setBooking(data as unknown as Booking)
    } catch (err) {
      console.error('Failed to load booking details', err)
      toast.error('Failed to load booking details')
      router.push('/dashboard/operator/bookings')
    } finally {
      setIsLoading(false)
    }
  }, [id, router])

  React.useEffect(() => {
    void loadBooking()
  }, [loadBooking])

  const confirmCancellation = async (b: Booking) => {
    try {
      await bookingService.cancelBooking(b.id)
      toast.success(`Booking ${b.bookingReference} cancelled successfully`)
      setIsCancelModalOpen(false)
      void loadBooking()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to cancel booking'
      toast.error(msg)
    }
  }

  const handleResubmit = (b: Booking) => {
    router.push(`/dashboard/operator/search/${b.siteId}`)
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
  const mapCenter = toGeometryCenter(booking.siteGeometry)
  const toalMode = toGeometryMode(booking.siteGeometry)
  const toalPoints = toPolygonPoints(booking.siteGeometry)
  const emergencyMode = toGeometryMode(booking.siteClzGeometry)
  const emergencyPoints = toPolygonPoints(booking.siteClzGeometry)
  const toalRadius = (booking.siteGeometry as any)?.radius ?? 150
  const emergencyRadius = (booking.siteClzGeometry as any)?.radius ?? 300
  const showEmergency = Boolean(booking.siteClzGeometry)

  const startTime = new Date(booking.startTime)
  const endTime = new Date(booking.endTime)

  return (
    <div className="flex flex-col h-[calc(100vh-60px)] w-full animate-fade-in">
      {/* Top Bar / Header */}
      <div className="flex items-center justify-between gap-4 px-4 md:px-6 py-3 border-b border-border/40 bg-background/95 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-muted-foreground hover:text-foreground shrink-0"
            onClick={() => router.push('/dashboard/operator/bookings')}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-xs font-bold">Back</span>
          </Button>
          <Separator orientation="vertical" className="h-8" />
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
              <span className="font-mono text-foreground">
                {booking.bookingReference ?? booking.vaId}
              </span>
            </div>
            <h1 className="text-sm font-bold tracking-tight text-foreground truncate max-w-[300px]">
              Access Request: {booking.siteName}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge
            className={`text-[9px] uppercase tracking-widest border-none font-bold h-5 px-2 ${
              booking.status === 'PENDING'
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'
                : booking.status === 'APPROVED'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                  : booking.status === 'REJECTED'
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                    : 'bg-muted text-muted-foreground'
            }`}
          >
            {booking.status}
          </Badge>
        </div>
      </div>

      {/* Style overrides for Leaflet PreviewMap nesting */}
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
        {/* Left Side: Map */}
        <div className="w-full lg:w-[60%] h-[350px] lg:h-full relative review-map-container shrink-0 bg-muted/20">
          <PreviewMap
            center={mapCenter}
            toalRadius={toalRadius}
            emergencyRadius={emergencyRadius}
            showEmergency={showEmergency}
            toalMode={toalMode}
            emergencyMode={emergencyMode}
            initialToalPolygonPoints={toalPoints}
            initialEmergencyPolygonPoints={emergencyPoints}
            className="w-full h-full"
          />
        </div>

        {/* Right Side: Details panel */}
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
            {/* Rejection Banner */}
            {booking.status === 'REJECTED' && (
              <div className="bg-destructive/5 border border-destructive/15 rounded-xl p-3.5 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">Reason for Rejection</h4>
                </div>
                <p className="text-sm font-medium text-destructive/90 italic leading-relaxed bg-background/50 p-2.5 rounded-lg border border-destructive/10">
                  "{booking.adminNote || 'No specific reason provided.'}"
                </p>
                <Button
                  className="w-full shadow-sm text-xs h-9"
                  variant="destructive"
                  onClick={() => handleResubmit(booking)}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Edit & Resubmit Request
                </Button>
              </div>
            )}

            {/* Request Details Section */}
            <div className="space-y-1.5">
              <h3 className="text-base font-semibold text-primary">
                Request Details
              </h3>
              <div className="bg-muted/10 rounded-lg p-3 border border-border/30 divide-y divide-border/20">
                <DetailRow
                  label="Request ID"
                  value={
                    <span className="font-mono text-sm text-foreground">
                      {(booking.bookingReference ?? booking.vaId ?? 'N/A').toUpperCase()}
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
                      {(booking.operatorFlyerId || booking.flyerId || 'PENDING').toUpperCase()}
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
                  label="Access Fee (Gross)"
                  value={
                    <span className="font-semibold text-base text-foreground">
                      £{(booking.toalCost ?? 0).toFixed(2)}
                    </span>
                  }
                />
                <DetailRow
                  label="Platform Service Fee"
                  value={
                    <span className="font-normal text-sm text-muted-foreground">
                      £{(booking.platformFee ?? 0).toFixed(2)}
                    </span>
                  }
                />
                <DetailRow
                  label="Payment Status"
                  value={
                    <Badge
                      className={
                        booking.useCategory === 'emergency_recovery'
                          ? 'bg-amber-50/10 text-amber-700 border-amber-200 font-medium text-xs px-2 py-0.5 shadow-none'
                          : 'bg-emerald-50/10 text-emerald-700 border-emerald-200 font-medium text-xs px-2 py-0.5 shadow-none'
                      }
                    >
                      {booking.useCategory === 'emergency_recovery'
                        ? 'Pending (Standby)'
                        : 'Paid'}
                    </Badge>
                  }
                />
              </div>
            </div>
          </div>

          {/* Sticky action footer at the bottom */}
          <div className="p-2 border-t border-border/40 bg-muted/10 shrink-0 flex flex-col gap-3">
            <Button
              variant="destructive"
              onClick={() => setIsCancelModalOpen(true)}
              disabled={
                booking.status === 'CANCELLED' ||
                booking.status === 'REJECTED' ||
                booking.status === 'EXPIRED'
              }
            >
              Cancel Booking
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs font-semibold h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/20 border border-transparent gap-2"
              onClick={() => router.push(`/dashboard/operator/incident-report/new?bookingId=${booking.id}&siteId=${booking.siteId}`)}
            >
              <ShieldAlert className="h-4 w-4" />
              Report an Issue
            </Button>
          </div>
        </div>
      </div>

      <CancellationModal
        booking={booking}
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={confirmCancellation}
      />
    </div>
  )
}
