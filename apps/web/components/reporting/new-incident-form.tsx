'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@workspace/ui/components/button'
import { Label } from '@workspace/ui/components/label'
import { Textarea } from '@workspace/ui/components/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select'
import { Checkbox } from '@workspace/ui/components/checkbox'
import { FileUploader } from '../file-uploader'
import { PreviewMap } from '@/components/map/preview-map'
import { Separator } from '@workspace/ui/components/separator'
import { toast } from 'sonner'
import { incidentService } from '@/services/incident.service'
import type { UploadedFileMetadata } from '@/services/media.service'
import { Loader2, ArrowLeft, Send, Info } from 'lucide-react'
import { bookingService } from '@/services/booking.service'
import { format } from 'date-fns'
import { circleAreaM2, polygonAreaM2, formatArea } from '@/lib/geojson-utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip'
import { Badge } from '@workspace/ui/components/badge'

const CATEGORIES = [
  { value: 'aircraft_incident', label: 'Aircraft Incident' },
  { value: 'infrastructure_incident', label: 'Infrastructure Incident' },
  { value: 'safety_incident', label: 'Safety Incident' },
  { value: 'property_damage', label: 'Property Damage' },
  { value: 'near_miss', label: 'Near Miss' },
  { value: 'injury', label: 'Injury' },
  { value: 'environmental', label: 'Environmental' },
  { value: 'unapproved_flight', label: 'Unapproved Flight' },
  { value: 'policy_non_compliance', label: 'Policy Non-Compliance' },
  { value: 'privacy_complaint', label: 'Privacy Complaint' },
  { value: 'refund', label: 'Refund' },
  { value: 'other', label: 'Other' },
]

const IMPACT_OPTIONS = [
  'No damage',
  'Asset damaged',
  'Aircraft damaged',
  'Injury',
  'Third-party property damage',
  'Operation interrupted',
  'Emergency services involved',
  'Insurance provider reported',
]

// ─── Local DetailRow component ────────────────────────────────────────────────

interface DetailRowProps {
  label: string
  value: React.ReactNode
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex items-center justify-between py-2 text-sm">
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

export function NewIncidentForm({
  role,
}: {
  role: 'operator' | 'assetmanager'
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const bookingId = searchParams.get('bookingId')
  const siteId = searchParams.get('siteId')
  const initialCategory = searchParams.get('category')

  const [bookingDetails, setBookingDetails] = React.useState<any>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Form State
  const [category, setCategory] = React.useState<string>(initialCategory || '')
  const [severity, setSeverity] = React.useState<string>('medium')
  const [description, setDescription] = React.useState('')
  const [impact, setImpact] = React.useState<string[]>([])
  const [attachments, setAttachments] = React.useState<UploadedFileMetadata[]>(
    [],
  )
  const [requestId, setRequestId] = React.useState('')

  const createRequestId = () =>
    globalThis.crypto?.randomUUID?.() ||
    `incident-${Date.now()}-${Math.random().toString(16).slice(2)}`

  React.useEffect(() => {
    setRequestId(createRequestId())
    if (bookingId) {
      bookingService
        .getBooking(bookingId)
        .then((data: any) => {
          if (data) {
            setBookingDetails(data)
          } else {
            toast.error('Could not load booking details.')
          }
        })
        .catch(() => toast.error('Error loading booking details.'))
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [bookingId])

  const handleImpactChange = (option: string, checked: boolean) => {
    if (checked) {
      setImpact((prev) => [...prev, option])
    } else {
      setImpact((prev) => prev.filter((item) => item !== option))
    }
  }

  const handleSubmit = async () => {
    if (!category || !description) {
      toast.error('Please fill in all required fields.')
      return
    }

    setIsSubmitting(true)
    try {
      const incident = await incidentService.createIncident({
        bookingId: bookingId || undefined,
        siteId: siteId || bookingDetails?.siteId,
        clientRequestId: requestId || createRequestId(),
        type: category,
        urgency: severity as any,
        description,
        impactAssessment: impact.length > 0 ? impact : undefined,
        attachments: attachments.map((attachment) => ({
          fileName: attachment.fileName,
          documentType: 'evidence',
          fileSize: String(attachment.fileSize),
          fileKey: attachment.fileKey,
        })),
      })

      toast.success('Incident report created successfully.')
      router.push(`/dashboard/${role}/incident-report/${incident.id}`)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create incident report')
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const showToal = bookingDetails
    ? bookingDetails.useCategory === 'planned_toal' ||
      bookingDetails.useCategory === 'both' ||
      !bookingDetails.useCategory
    : true
  const showEmergency = bookingDetails
    ? (bookingDetails.useCategory === 'emergency_recovery' ||
        bookingDetails.useCategory === 'both' ||
        !bookingDetails.useCategory) &&
      !!bookingDetails.siteClzGeometry
    : true

  const geo = (
    bookingDetails &&
    bookingDetails.useCategory === 'emergency_recovery' &&
    bookingDetails.siteClzGeometry
      ? bookingDetails.siteClzGeometry
      : bookingDetails?.siteGeometry
  ) as any

  // Compute centroid from polygon points (if polygon), or use stored center
  const computeGeoCenter = (
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
      if (count > 0) return { lat: sumLat / count, lng: sumLng / count }
    }
    const c = geometry?.center ?? geometry?.geometry?.center ?? null
    if (c?.lat && c?.lng) return { lat: c.lat, lng: c.lng }
    return null
  }
  const center = computeGeoCenter(geo)

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
      .filter((p: [number, number] | null): p is [number, number] => p !== null)
  }

  const toalMode =
    (bookingDetails?.siteGeometry as any)?.type === 'polygon'
      ? 'polygon'
      : ('circle' as const)
  const emergencyMode =
    (bookingDetails?.siteClzGeometry as any)?.type === 'polygon'
      ? 'polygon'
      : ('circle' as const)

  return (
    <div className="flex flex-col h-[calc(100vh-60px)] w-full animate-fade-in text-foreground">
      {/* Top Bar / Header */}
      <div className="flex items-center justify-between gap-4 px-4 md:px-6 py-3 border-b border-border/40 bg-background/95 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-muted-foreground hover:text-foreground shrink-0"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-xs font-bold">Back</span>
          </Button>
          <Separator orientation="vertical" className="h-8" />
          <div className="flex flex-col gap-0.5 min-w-0">
            <h1 className="text-sm font-bold tracking-tight text-foreground truncate max-w-[300px]">
              Report Incident
            </h1>
            {bookingDetails && (
              <div className="text-[10px] font-bold text-muted-foreground">
                Operation ID:{' '}
                <span className="font-mono text-foreground">
                  {(bookingDetails.bookingReference || '').toUpperCase()}
                </span>
              </div>
            )}
          </div>
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
          {center?.lat && center?.lng ? (
            <PreviewMap
              center={{ lat: center.lat, lng: center.lng }}
              toalRadius={(bookingDetails?.siteGeometry as any)?.radius ?? 150}
              emergencyRadius={
                (bookingDetails?.siteClzGeometry as any)?.radius ?? 300
              }
              showEmergency={showEmergency}
              showToal={showToal}
              toalMode={toalMode}
              emergencyMode={emergencyMode}
              initialToalPolygonPoints={convertPoints(
                bookingDetails?.siteGeometry,
              )}
              initialEmergencyPolygonPoints={convertPoints(
                bookingDetails?.siteClzGeometry,
              )}
              className="w-full h-full"
            />
          ) : (
            <div className="w-full h-full bg-muted/10 flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
              <span className="font-semibold text-sm mb-1 opacity-60">
                Map Unavailable
              </span>
              <span className="text-xs">
                Location coordinates are missing for this asset.
              </span>
            </div>
          )}
        </div>

        {/* Right Side: Form details panel */}
        <div className="w-full lg:w-[40%] h-auto lg:h-full flex flex-col border-t lg:border-t-0 lg:border-l border-border/40 bg-background min-h-0 shrink-0 lg:shrink">
          {/* Header area of form panel */}
          <div className="px-4.5 py-3 border-b border-border/40 bg-muted/10 shrink-0">
            <div className="text-sm font-semibold text-muted-foreground">
              New Report
            </div>
            <h2 className="text-xl font-bold tracking-tight text-foreground mt-0.5">
              Incident Details
            </h2>
          </div>

          {/* Scrollable form contents */}
          <div className="flex-1 overflow-y-auto p-4.5 space-y-6 custom-scrollbar text-foreground pb-24">
            {/* Operation Details (if loaded) */}
            {bookingDetails && (
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-primary border-b border-border/40 pb-1.5 flex items-center gap-1.5">
                  <Info className="h-4 w-4" /> Operation Details
                </h3>

                {/* Request Details */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Request Details
                  </h4>
                  <div className="bg-muted/10 rounded-lg p-3 border border-border/30 divide-y divide-border/20">
                    <DetailRow
                      label="Request ID"
                      value={
                        <span className="font-mono text-xs text-foreground">
                          {(
                            bookingDetails.bookingReference ||
                            bookingDetails.vaId ||
                            'N/A'
                          ).toUpperCase()}
                        </span>
                      }
                    />
                    <DetailRow
                      label="Capability Requested"
                      value={
                        <div className="flex items-center gap-1.5">
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
                          {bookingDetails.operationType && (
                            <Badge className="bg-blue-500 hover:bg-blue-600 font-medium text-[10px] px-1.5 py-0.5 text-white shadow-none">
                              {bookingDetails.operationType === 'INBOUND'
                                ? 'Inbound'
                                : 'Outbound'}
                            </Badge>
                          )}
                        </div>
                      }
                    />
                    <div className="py-2 text-xs">
                      <span className="text-xs font-medium text-muted-foreground block mb-0.5">
                        Operational Intent
                      </span>
                      <span className="font-normal text-foreground italic leading-relaxed block">
                        "
                        {bookingDetails.missionIntent ||
                          'No operational intent description provided.'}
                        "
                      </span>
                    </div>
                  </div>
                </div>

                {/* Asset Information */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Asset Information
                  </h4>
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
                              .map(
                                (w: string) =>
                                  w.charAt(0).toUpperCase() + w.slice(1),
                              )
                              .join(' ')
                          : 'N/A'
                      }
                    />
                    {bookingDetails.siteType && (
                      <DetailRow
                        label="Asset Zone Type"
                        value={
                          bookingDetails.siteType === 'emergency'
                            ? 'Emergency Recovery'
                            : 'Take-off & Landing (TOAL)'
                        }
                      />
                    )}
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
                  const toalPoints = toPolygonPoints(
                    bookingDetails.siteGeometry,
                  )
                  const emergencyMode = toGeometryMode(
                    bookingDetails.siteClzGeometry,
                  )
                  const emergencyPoints = toPolygonPoints(
                    bookingDetails.siteClzGeometry,
                  )
                  const toalRadius =
                    (bookingDetails.siteGeometry as any)?.radius ?? 150
                  const emergencyRadius =
                    (bookingDetails.siteClzGeometry as any)?.radius ?? 300

                  const computedToalArea =
                    toalMode === 'polygon'
                      ? formatArea(polygonAreaM2(toalPoints))
                      : formatArea(circleAreaM2(toalRadius))

                  const computedEmergencyArea =
                    emergencyMode === 'polygon'
                      ? formatArea(polygonAreaM2(emergencyPoints))
                      : formatArea(circleAreaM2(emergencyRadius))

                  return (
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Asset Geometry
                      </h4>
                      <div className="bg-muted/10 rounded-lg p-3 border border-border/30 divide-y divide-border/20">
                        {showToal && (
                          <DetailRow
                            label="TOAL Boundary"
                            value={formatBoundarySummary(
                              toalMode,
                              toalRadius,
                              toalPoints,
                            )}
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
                            value={formatBoundarySummary(
                              emergencyMode,
                              emergencyRadius,
                              emergencyPoints,
                            )}
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
                  const duration = Math.round(
                    (endTime.getTime() - startTime.getTime()) / (1000 * 60),
                  )
                  return (
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Operation Window
                      </h4>
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
                              {duration} minutes
                            </span>
                          }
                        />
                      </div>
                    </div>
                  )
                })()}

                {/* Aircraft Info */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Aircraft Info
                  </h4>
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
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Operator Info
                  </h4>
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
                      value={
                        bookingDetails.operatorOrganisation || 'Independent'
                      }
                    />
                    <DetailRow
                      label="CAA Flyer ID"
                      value={
                        <span className="font-mono text-xs text-foreground">
                          {(
                            bookingDetails.operatorFlyerId ||
                            bookingDetails.flyerId ||
                            'PENDING'
                          ).toUpperCase()}
                        </span>
                      }
                    />
                    <DetailRow
                      label="CAA Operator ID"
                      value={
                        <span className="font-mono text-xs text-foreground">
                          {(
                            bookingDetails.operatorReference || 'PENDING'
                          ).toUpperCase()}
                        </span>
                      }
                    />
                  </div>
                </div>

                {/* Commercial Summary */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Commercial Summary
                  </h4>
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
                      value={(() => {
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
                                <TooltipContent
                                  side="top"
                                  className="max-w-[240px] text-center bg-popover text-popover-foreground border"
                                >
                                  <p className="text-xs">{badgeInfo.tooltip}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        )
                      })()}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Classification & Severity */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-primary border-b border-border/40 pb-1.5">
                Classification & Severity
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="category"
                    className="text-xs font-semibold text-muted-foreground"
                  >
                    Incident Category *
                  </Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger
                      id="category"
                      className="h-10 bg-muted/10 border-border/60"
                    >
                      <SelectValue placeholder="Select a category..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem
                          key={cat.value}
                          value={cat.value}
                          className="font-medium"
                        >
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground block">
                    Severity Level *
                  </Label>
                  <div className="flex flex-wrap gap-4 pt-1">
                    {[
                      {
                        value: 'low',
                        label: 'Low',
                        color: 'text-green-600',
                        ringColor: 'focus:ring-green-600',
                      },
                      {
                        value: 'medium',
                        label: 'Medium',
                        color: 'text-amber-600',
                        ringColor: 'focus:ring-amber-600',
                      },
                      {
                        value: 'high',
                        label: 'High',
                        color: 'text-orange-600',
                        ringColor: 'focus:ring-orange-600',
                      },
                      {
                        value: 'critical',
                        label: 'Critical',
                        color: 'text-red-600',
                        ringColor: 'focus:ring-red-600',
                      },
                    ].map((sev) => (
                      <div
                        key={sev.value}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="radio"
                          name="severity"
                          value={sev.value}
                          id={`sev-${sev.value}`}
                          checked={severity === sev.value}
                          onChange={(e) => setSeverity(e.target.value)}
                          className={`h-4 w-4 ${sev.ringColor} text-primary cursor-pointer border-border`}
                        />
                        <Label
                          htmlFor={`sev-${sev.value}`}
                          className={`font-semibold text-sm cursor-pointer ${sev.color}`}
                        >
                          {sev.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Narrative */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-primary border-b border-border/40 pb-1.5">
                Description
              </h3>
              <div className="space-y-2">
                <Label
                  htmlFor="description"
                  className="text-xs font-semibold text-muted-foreground"
                >
                  Incident Description *
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe exactly what happened in as much detail as possible..."
                  className="min-h-[120px] bg-muted/10 border-border/60 resize-y font-medium text-sm leading-relaxed"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            {/* Impact Assessment */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-primary border-b border-border/40 pb-1.5">
                Impact Assessment
              </h3>
              <div className="grid grid-cols-1 gap-2.5">
                {IMPACT_OPTIONS.map((option) => (
                  <div key={option} className="flex items-center space-x-3">
                    <Checkbox
                      id={`impact-${option}`}
                      checked={impact.includes(option)}
                      onCheckedChange={(checked) =>
                        handleImpactChange(option, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`impact-${option}`}
                      className="font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Evidence */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-primary border-b border-border/40 pb-1.5">
                Evidence
              </h3>
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground block">
                  Upload documents, pictures, or videos
                </span>
                <FileUploader
                  maxSize={15}
                  className="bg-muted/5 border-border/40"
                  onUploadComplete={setAttachments}
                />
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-4 border-t border-border/40 bg-muted/10 shrink-0 flex gap-3">
            <Button
              variant="outline"
              className="flex-1 h-10 font-semibold"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md gap-2"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> Submit Report
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
