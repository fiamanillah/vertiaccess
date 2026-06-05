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
import { Loader2, ArrowLeft, Send } from 'lucide-react'
import { bookingService } from '@/services/booking.service'
import { format } from 'date-fns'

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

export function NewIncidentForm({ role }: { role: 'operator' | 'landowner' }) {
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
  const computeGeoCenter = (geometry: any): { lat: number; lng: number } | null => {
    if (geometry?.type === 'polygon' && Array.isArray(geometry.points) && geometry.points.length > 0) {
      let sumLat = 0, sumLng = 0, count = 0
      for (const pt of geometry.points) {
        if (pt && typeof pt === 'object' && !Array.isArray(pt) &&
            typeof pt.lat === 'number' && typeof pt.lng === 'number') {
          sumLat += pt.lat; sumLng += pt.lng; count++
        } else if (Array.isArray(pt) && pt.length >= 2 &&
                   typeof pt[0] === 'number' && typeof pt[1] === 'number') {
          sumLat += pt[0]; sumLng += pt[1]; count++
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

  const toalMode = (bookingDetails?.siteGeometry as any)?.type === 'polygon' ? 'polygon' : 'circle' as const
  const emergencyMode = (bookingDetails?.siteClzGeometry as any)?.type === 'polygon' ? 'polygon' : 'circle' as const

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
                  {bookingDetails.bookingReference}
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
              initialToalPolygonPoints={convertPoints(bookingDetails?.siteGeometry)}
              initialEmergencyPolygonPoints={convertPoints(bookingDetails?.siteClzGeometry)}
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
              <div className="space-y-1.5">
                <h3 className="text-base font-bold uppercase tracking-wider text-primary text-xs">
                  Operation Details
                </h3>
                <div className="bg-muted/10 rounded-lg p-3 border border-border/30 divide-y divide-border/20">
                  <div className="flex items-center justify-between py-1.5 text-xs">
                    <span className="font-medium text-muted-foreground">
                      Operation ID
                    </span>
                    <span className="font-mono font-medium bg-muted/50 px-2 py-0.5 rounded text-[11px] inline-block">
                      {bookingDetails.bookingReference}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 text-xs">
                    <span className="font-medium text-muted-foreground">
                      Asset Name
                    </span>
                    <span className="font-medium text-foreground">
                      {bookingDetails.siteName || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 text-xs">
                    <span className="font-medium text-muted-foreground">
                      Asset ID
                    </span>
                    <span className="font-medium text-foreground">
                      {bookingDetails.siteVaId || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 text-xs">
                    <span className="font-medium text-muted-foreground">
                      Asset Type
                    </span>
                    <span className="font-medium capitalize text-foreground">
                      {bookingDetails.siteCategory?.replace(/_/g, ' ') || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 text-xs">
                    <span className="font-medium text-muted-foreground">
                      Capability Requested
                    </span>
                    <span className="font-medium text-foreground">
                      {bookingDetails.useCategory === 'planned_toal'
                        ? 'TOAL'
                        : bookingDetails.useCategory === 'emergency_recovery'
                          ? 'Emergency Recovery'
                          : bookingDetails.useCategory}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 text-xs">
                    <span className="font-medium text-muted-foreground">
                      Start Date & Time
                    </span>
                    <span className="font-medium text-foreground">
                      {format(
                        new Date(bookingDetails.startTime),
                        'dd-MM-yyyy HH:mm',
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 text-xs">
                    <span className="font-medium text-muted-foreground">
                      End Date & Time
                    </span>
                    <span className="font-medium text-foreground">
                      {format(
                        new Date(bookingDetails.endTime),
                        'dd-MM-yyyy HH:mm',
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 text-xs">
                    <span className="font-medium text-muted-foreground">
                      Drone Model
                    </span>
                    <span className="font-medium text-foreground">
                      {bookingDetails.droneModel || 'N/A'}
                    </span>
                  </div>
                  <div className="py-2 text-xs">
                    <span className="font-medium text-muted-foreground block mb-0.5">
                      Operational Intent
                    </span>
                    <span className="font-normal text-foreground italic leading-relaxed block">
                      "{bookingDetails.missionIntent || 'N/A'}"
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Classification & Severity */}
            <div className="space-y-4">
              <h3 className="text-base font-bold uppercase tracking-wider text-primary text-xs border-b border-border/40 pb-1.5">
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
              <h3 className="text-base font-bold uppercase tracking-wider text-primary text-xs border-b border-border/40 pb-1.5">
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
              <h3 className="text-base font-bold uppercase tracking-wider text-primary text-xs border-b border-border/40 pb-1.5">
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
              <h3 className="text-base font-bold uppercase tracking-wider text-primary text-xs border-b border-border/40 pb-1.5">
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
