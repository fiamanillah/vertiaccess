'use client'

import * as React from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@workspace/ui/components/sheet'
import { Button } from '@workspace/ui/components/button'
import { Badge } from '@workspace/ui/components/badge'
import { Separator } from '@workspace/ui/components/separator'
import {
  Plane,
  Target,
  Calendar,
  Clock,
  CreditCard,
  MapPin,
  FileText,
  ExternalLink,
  AlertCircle,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react'
import { Booking } from '../types'
import { cn } from '@workspace/ui/lib/utils'
import { format } from 'date-fns'
import { PreviewMap } from '@/components/map/preview-map'
import { useRouter } from 'next/navigation'

interface BookingDetailDrawerProps {
  booking: Booking | null
  isOpen: boolean
  onClose: () => void
  onCancel: (booking: Booking) => void
  onResubmit?: (booking: Booking) => void
}

function getStatusBadgeConfig(status: string) {
  switch (status.toUpperCase()) {
    case 'APPROVED':
      return {
        label: 'Approved',
        className:
          'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
        dot: 'bg-emerald-500 animate-pulse',
      }
    case 'ACTIVATED':
      return {
        label: 'Activated',
        className:
          'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
        dot: 'bg-blue-500 animate-pulse',
      }
    case 'COMPLETED':
      return {
        label: 'Completed',
        className:
          'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20',
        dot: 'bg-indigo-500',
      }
    case 'PENDING':
      return {
        label: 'Pending',
        className:
          'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
        dot: 'bg-amber-500 animate-pulse',
      }
    case 'REJECTED':
      return {
        label: 'Rejected',
        className:
          'bg-destructive/10 text-destructive border border-destructive/20',
        dot: 'bg-destructive',
      }
    case 'CANCELLED':
      return {
        label: 'Cancelled',
        className: 'bg-muted text-muted-foreground border border-border',
        dot: 'bg-muted-foreground',
      }
    case 'EXPIRED':
      return {
        label: 'Expired',
        className: 'bg-muted text-muted-foreground border border-border',
        dot: 'bg-muted-foreground',
      }
    default:
      return {
        label: status,
        className: 'bg-primary/10 text-primary border border-primary/20',
        dot: 'bg-primary',
      }
  }
}

export function BookingDetailDrawer({
  booking,
  isOpen,
  onClose,
  onCancel,
  onResubmit,
}: BookingDetailDrawerProps) {
  const router = useRouter()

  if (!booking) return null

  const startTime = new Date(booking.startTime)
  const endTime = new Date(booking.endTime)
  const statusConfig = getStatusBadgeConfig(booking.status)

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-md flex flex-col p-0 gap-0 border-l border-border/80 shadow-2xl bg-background">
        <SheetHeader className="p-4 border-b bg-muted/20 backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <Badge
              variant="outline"
              className="text-xs font-semibold px-2 py-0.5 border-primary/20 text-primary bg-primary/5"
            >
              {(booking.bookingReference || '').toUpperCase()}
            </Badge>
            <Badge
              className={cn(
                'text-xs font-semibold px-2.5 py-1 border flex items-center gap-1.5 shadow-none',
                statusConfig.className,
              )}
            >
              <span
                className={cn('h-1.5 w-1.5 rounded-full', statusConfig.dot)}
              />
              {statusConfig.label}
            </Badge>
          </div>
          <div className="flex flex-col gap-1">
            <SheetTitle className="text-lg font-bold tracking-tight text-foreground">
              Infrastructure Access Request
            </SheetTitle>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Map preview — derive coordinates from correct geometry depending on useCategory */}
          {(() => {
            const showToal =
              booking.useCategory === 'planned_toal' ||
              (booking.useCategory as string) === 'both' ||
              !booking.useCategory
            const showEmergency =
              (booking.useCategory === 'emergency_recovery' ||
                (booking.useCategory as string) === 'both' ||
                !booking.useCategory) &&
              !!booking.siteClzGeometry

            const geo = (
              booking.useCategory === 'emergency_recovery' &&
              booking.siteClzGeometry
                ? booking.siteClzGeometry
                : booking.siteGeometry
            ) as any

            // Compute centroid from polygon points (if polygon), or use stored center
            const computeCenter = (
              geometry: any,
            ): { lat: number; lng: number } | null => {
              if (
                geometry?.type === 'polygon' &&
                Array.isArray(geometry.points) &&
                geometry.points.length > 0
              ) {
                let sumLat = 0,
                  sumLng = 0,
                  count = 0
                for (const pt of geometry.points) {
                  if (
                    pt &&
                    typeof pt === 'object' &&
                    !Array.isArray(pt) &&
                    typeof pt.lat === 'number' &&
                    typeof pt.lng === 'number'
                  ) {
                    sumLat += pt.lat
                    sumLng += pt.lng
                    count++
                  } else if (
                    Array.isArray(pt) &&
                    pt.length >= 2 &&
                    typeof pt[0] === 'number' &&
                    typeof pt[1] === 'number'
                  ) {
                    sumLat += pt[0]
                    sumLng += pt[1]
                    count++
                  }
                }
                if (count > 0)
                  return { lat: sumLat / count, lng: sumLng / count }
              }
              const c = geometry?.center ?? geometry?.geometry?.center ?? null
              if (c?.lat && c?.lng) return { lat: c.lat, lng: c.lng }
              return null
            }
            const center = computeCenter(geo)

            // Convert polygon points from { lat, lng } objects to [lat, lng] tuples
            const convertPoints = (geometry: any): [number, number][] => {
              if (!geometry || !Array.isArray(geometry.points)) return []
              return geometry.points
                .map((point: any): [number, number] | null => {
                  if (
                    point &&
                    typeof point === 'object' &&
                    !Array.isArray(point) &&
                    typeof point.lat === 'number' &&
                    typeof point.lng === 'number'
                  ) {
                    return [point.lat, point.lng]
                  }
                  if (
                    Array.isArray(point) &&
                    point.length >= 2 &&
                    typeof point[0] === 'number' &&
                    typeof point[1] === 'number'
                  ) {
                    return [point[0], point[1]]
                  }
                  return null
                })
                .filter(
                  (p: [number, number] | null): p is [number, number] =>
                    p !== null,
                )
            }

            const toalMode =
              (booking.siteGeometry as any)?.type === 'polygon'
                ? 'polygon'
                : ('circle' as const)
            const emergencyMode =
              (booking.siteClzGeometry as any)?.type === 'polygon'
                ? 'polygon'
                : ('circle' as const)

            if (center?.lat && center?.lng) {
              return (
                <PreviewMap
                  center={{ lat: center.lat, lng: center.lng }}
                  toalRadius={(booking.siteGeometry as any)?.radius ?? 150}
                  emergencyRadius={
                    (booking.siteClzGeometry as any)?.radius ?? 300
                  }
                  showEmergency={showEmergency}
                  showToal={showToal}
                  toalMode={toalMode}
                  emergencyMode={emergencyMode}
                  initialToalPolygonPoints={convertPoints(booking.siteGeometry)}
                  initialEmergencyPolygonPoints={convertPoints(
                    booking.siteClzGeometry,
                  )}
                  className="w-full h-44 overflow-hidden border-b border-border/50"
                />
              )
            }
            return (
              <div className="w-full h-44 bg-muted/30 flex items-center justify-center border-b border-border/50">
                <div className="text-center space-y-1">
                  <MapPin className="h-6 w-6 text-muted-foreground mx-auto opacity-50" />
                  <p className="text-xs font-semibold text-muted-foreground">
                    Coordinates Unavailable
                  </p>
                </div>
              </div>
            )
          })()}

          <div className="p-4 space-y-4">
            {/* Rejection Feedback */}
            {booking.status === 'REJECTED' && (
              <div className="bg-destructive/5 border border-destructive/15 rounded-xl p-3.5 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">
                    Reason for Rejection
                  </h4>
                </div>
                <p className="text-sm font-medium text-destructive/90 italic leading-relaxed bg-background/50 p-2.5 rounded-lg border border-destructive/10">
                  "{booking.adminNote || 'No specific reason provided.'}"
                </p>
                <Button
                  className="w-full shadow-sm text-xs h-9"
                  variant="destructive"
                  onClick={() => onResubmit?.(booking)}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Edit & Resubmit Request
                </Button>
              </div>
            )}

            {/* Operation Details */}
            <section className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                  <Target className="h-3.5 w-3.5" />
                </div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">
                  Operation Details
                </h3>
              </div>
              <div className="bg-card/40 rounded-xl p-3.5 border border-border/60 backdrop-blur-sm shadow-sm divide-y divide-border/30 space-y-2.5 *:pt-2.5 first:*:pt-0">
                <div className="flex justify-between items-center py-1.5 text-sm">
                  <span className="font-medium text-muted-foreground">
                    Request ID
                  </span>
                  <span className="font-mono bg-muted/50 px-2 py-0.5 rounded text-xs text-foreground">
                    {(booking.bookingReference || '').toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 text-sm">
                  <span className="font-medium text-muted-foreground">
                    Asset Name
                  </span>
                  <span className="font-semibold text-foreground text-right">
                    {booking.siteName || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 text-sm">
                  <span className="font-medium text-muted-foreground">
                    Asset ID
                  </span>
                  <span className="font-mono text-xs text-foreground text-right">
                    {booking.siteVaId
                      ? booking.siteVaId.toUpperCase()
                      : booking.siteName || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 text-sm">
                  <span className="font-medium text-muted-foreground">
                    Asset Type
                  </span>
                  <span className="font-semibold text-foreground text-right">
                    {booking.siteCategory
                      ? booking.siteCategory
                          .split('_')
                          .map(
                            (w: string) =>
                              w.charAt(0).toUpperCase() + w.slice(1),
                          )
                          .join(' ')
                      : 'N/A'}
                  </span>
                </div>
                {booking.siteType && (
                  <div className="flex justify-between items-center py-1.5 text-sm">
                    <span className="font-medium text-muted-foreground">
                      Asset Zone Type
                    </span>
                    <span className="font-semibold text-foreground text-right">
                      {booking.siteType === 'emergency'
                        ? 'Emergency Recovery'
                        : 'Take-off & Landing (TOAL)'}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center py-1.5 text-sm">
                  <span className="font-medium text-muted-foreground">
                    Asset Status
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-semibold text-foreground text-right">
                    {(() => {
                      const status =
                        booking.siteStatus?.toUpperCase() || 'ACTIVE'
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
                        <>
                          <span
                            className={`h-1.5 w-1.5 rounded-full animate-pulse ${dotColor}`}
                          />
                          {booking.siteStatus
                            ? booking.siteStatus.charAt(0).toUpperCase() +
                              booking.siteStatus.slice(1).toLowerCase()
                            : 'Active'}
                        </>
                      )
                    })()}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 text-sm">
                  <span className="font-medium text-muted-foreground">
                    Capability Requested
                  </span>
                  <span className="font-semibold text-foreground text-right">
                    {booking.useCategory === 'planned_toal'
                      ? 'TOAL'
                      : booking.useCategory === 'emergency_recovery'
                        ? 'Emergency Recovery'
                        : booking.useCategory}
                  </span>
                </div>
                {booking.operationType && (
                  <div className="flex justify-between items-center py-1.5 text-sm">
                    <span className="font-medium text-muted-foreground">
                      Operation Type
                    </span>
                    <span className="font-semibold text-foreground text-right">
                      {booking.operationType === 'INBOUND'
                        ? 'Inbound'
                        : 'Outbound'}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center py-1.5 text-sm">
                  <span className="font-medium text-muted-foreground">
                    Start Date and Time
                  </span>
                  <span className="font-semibold text-foreground text-right">
                    {format(startTime, 'dd-MM-yyyy HH:mm')}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 text-sm">
                  <span className="font-medium text-muted-foreground">
                    End Date and Time
                  </span>
                  <span className="font-semibold text-foreground text-right">
                    {format(endTime, 'dd-MM-yyyy HH:mm')}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 text-sm">
                  <span className="font-medium text-muted-foreground">
                    Operational Intent
                  </span>
                  <span className="font-medium text-foreground italic text-right">
                    "{booking.missionIntent || 'N/A'}"
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 text-sm">
                  <span className="font-medium text-muted-foreground">
                    Drone Model
                  </span>
                  <span className="font-semibold text-foreground text-right">
                    {booking.droneModel || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 text-sm">
                  <span className="font-medium text-muted-foreground">
                    Manufacturer
                  </span>
                  <span className="font-semibold text-foreground text-right">
                    {booking.manufacturer || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 text-sm">
                  <span className="font-medium text-muted-foreground">
                    Airframe
                  </span>
                  <span className="font-semibold text-foreground text-right">
                    {booking.airframe || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 text-sm">
                  <span className="font-medium text-muted-foreground">
                    Maximum Take-off Weight (MTOW)
                  </span>
                  <span className="font-semibold text-foreground text-right">
                    {booking.mtow || 'N/A'}
                  </span>
                </div>
                <div className="pt-3 border-t border-border/40">
                  <Button
                    variant="outline"
                    className="w-full text-xs font-semibold h-8"
                    onClick={() =>
                      window.open(
                        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.siteAddress ?? booking.siteName ?? '')}`,
                        '_blank',
                      )
                    }
                  >
                    <ExternalLink className="mr-2 h-3.5 w-3.5" />
                    Open in Google Maps
                  </Button>
                </div>
              </div>
            </section>

            {/* Financial Snapshot */}
            <section className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                  <CreditCard className="h-3.5 w-3.5" />
                </div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">
                  Financial Summary
                </h3>
              </div>
              <div
                className={cn(
                  'rounded-xl p-4 flex items-center justify-between border shadow-sm',
                  booking.useCategory === 'emergency_recovery'
                    ? 'bg-amber-500/5 border-amber-500/20'
                    : 'bg-primary/5 border-primary/20',
                )}
              >
                <div className="space-y-0.5">
                  <div
                    className={cn(
                      'text-xs font-semibold text-muted-foreground uppercase tracking-wider',
                      booking.useCategory === 'emergency_recovery'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-primary',
                    )}
                  >
                    {booking.useCategory === 'emergency_recovery'
                      ? 'Potential Emergency Fee'
                      : 'Total Cost (Paid)'}
                  </div>
                  <div
                    className={cn(
                      'text-2xl font-black tracking-tight',
                      booking.useCategory === 'emergency_recovery'
                        ? 'text-amber-700 dark:text-amber-500'
                        : 'text-foreground',
                    )}
                  >
                    £{(booking.toalCost ?? 0).toFixed(2)}
                  </div>
                  <p className="text-xs font-medium text-muted-foreground mt-0.5">
                    via Card ending in {booking.paymentMethodLast4 || 'XXXX'}
                  </p>
                </div>
                <div className="text-right">
                  <Badge
                    className={cn(
                      'border border-none font-bold text-xs',
                      booking.useCategory === 'emergency_recovery'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        : 'bg-primary/10 text-primary',
                    )}
                  >
                    {booking.useCategory === 'emergency_recovery'
                      ? 'STANDBY'
                      : 'PAID'}
                  </Badge>
                </div>
              </div>
            </section>
          </div>
        </div>

        <SheetFooter className="p-4 border-t bg-muted/10 flex flex-col gap-3">
          <Button
            variant="destructive"
            size="sm"
            className="w-full text-sm font-semibold h-10 shadow-sm"
            onClick={() => onCancel(booking)}
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
            className="w-full text-xs font-semibold h-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/20 border border-transparent gap-2"
            onClick={() =>
              router.push(
                `/dashboard/operator/incident-report/new?bookingId=${booking.id}&siteId=${booking.siteId}`,
              )
            }
          >
            <ShieldAlert className="h-4 w-4" />
            Report an Issue
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
