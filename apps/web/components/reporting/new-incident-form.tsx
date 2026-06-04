'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@workspace/ui/components/card'
import { Button } from '@workspace/ui/components/button'
import { Label } from '@workspace/ui/components/label'
import { Textarea } from '@workspace/ui/components/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui/components/select'
import { Checkbox } from '@workspace/ui/components/checkbox'
import { FileUploader } from '../file-uploader'
import { PreviewMap } from '@/components/map/preview-map'
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
  'Regulatory notification required'
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
  const [attachments, setAttachments] = React.useState<UploadedFileMetadata[]>([])
  const [requestId, setRequestId] = React.useState('')

  const createRequestId = () =>
    globalThis.crypto?.randomUUID?.() ||
    `incident-${Date.now()}-${Math.random().toString(16).slice(2)}`

  React.useEffect(() => {
    setRequestId(createRequestId())
    if (bookingId) {
      bookingService.getBooking(bookingId)
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

  const geo = bookingDetails?.siteGeometry as any
  const center = geo?.center ?? geo?.geometry?.center ?? null

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-10 w-10 shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight">Report Incident</h1>
        </div>
      </div>

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardContent className="p-8 space-y-12">
          
          {/* Operation Details */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-primary border-b border-border/50 pb-2">Operation Details</h3>
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4 text-sm bg-muted/10 p-4 rounded-lg">
              {bookingDetails ? (
                <>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground block">Operation ID</span>
                    <span className="font-mono font-medium bg-muted/50 px-2 py-0.5 rounded text-xs inline-block">{bookingDetails.bookingReference}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground block">Asset Name</span>
                    <span className="font-medium">{bookingDetails.siteName || 'N/A'}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground block">Asset ID</span>
                    <span className="font-medium">{bookingDetails.siteVaId || 'N/A'}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground block">Asset Type</span>
                    <span className="font-medium capitalize">{bookingDetails.siteCategory?.replace(/_/g, ' ') || 'N/A'}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground block">Capability Requested</span>
                    <span className="font-medium">{bookingDetails.useCategory === 'planned_toal' ? 'TOAL' : bookingDetails.useCategory === 'emergency_recovery' ? 'Emergency Recovery' : bookingDetails.useCategory}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground block">Start Date & Time</span>
                    <span className="font-medium">{format(new Date(bookingDetails.startTime), 'dd-MM-yyyy HH:mm')}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground block">End Date & Time</span>
                    <span className="font-medium">{format(new Date(bookingDetails.endTime), 'dd-MM-yyyy HH:mm')}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground block">Operational Intent</span>
                    <span className="font-medium italic">"{bookingDetails.missionIntent || 'N/A'}"</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground block">Drone Model</span>
                    <span className="font-medium">{bookingDetails.droneModel || 'N/A'}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground block">Manufacture</span>
                    <span className="font-medium">{bookingDetails.manufacturer || 'N/A'}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground block">Airframe</span>
                    <span className="font-medium">{bookingDetails.airframe || 'N/A'}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground block">MTOW</span>
                    <span className="font-medium">{bookingDetails.mtow || 'N/A'}</span>
                  </div>
                </>
              ) : (
                <div className="col-span-2 text-muted-foreground italic text-sm py-2">No operation linked to this incident.</div>
              )}
            </div>
          </section>

          {/* Incident Classification & Severity */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-primary border-b border-border/50 pb-2">Classification</h3>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-semibold text-muted-foreground">Incident Category *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category" className="h-10 bg-muted/10 border-border/60">
                    <SelectValue placeholder="Select a category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value} className="font-medium">
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold text-muted-foreground block">Severity Level *</Label>
                <div className="flex flex-wrap gap-4 pt-1">
                  {[
                    { value: 'low', label: 'Low', color: 'text-green-600', ringColor: 'focus:ring-green-600' },
                    { value: 'medium', label: 'Medium', color: 'text-amber-600', ringColor: 'focus:ring-amber-600' },
                    { value: 'high', label: 'High', color: 'text-orange-600', ringColor: 'focus:ring-orange-600' },
                    { value: 'critical', label: 'Critical', color: 'text-red-600', ringColor: 'focus:ring-red-600' }
                  ].map((sev) => (
                    <div key={sev.value} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="severity"
                        value={sev.value}
                        id={`sev-${sev.value}`}
                        checked={severity === sev.value}
                        onChange={(e) => setSeverity(e.target.value)}
                        className={`h-4 w-4 ${sev.ringColor} text-primary cursor-pointer border-border`}
                      />
                      <Label htmlFor={`sev-${sev.value}`} className={`font-semibold text-sm cursor-pointer ${sev.color}`}>
                        {sev.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Incident Location */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-primary border-b border-border/50 pb-2">Incident Location</h3>
            <div className="h-[250px] rounded-lg overflow-hidden border border-border/50">
              {center?.lat && center?.lng ? (
                <PreviewMap
                  center={{ lat: center.lat, lng: center.lng }}
                  toalRadius={geo?.radius ?? 150}
                  emergencyRadius={(bookingDetails?.siteClzGeometry as any)?.radius ?? 300}
                  showEmergency={!!bookingDetails?.siteClzGeometry}
                  toalMode={geo?.type === 'polygon' ? 'polygon' : 'circle'}
                  emergencyMode={'circle'}
                  className="w-full h-full"
                />
              ) : (
                <div className="w-full h-full bg-muted/10 flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
                  <span className="font-semibold text-sm mb-1 opacity-60">Map Unavailable</span>
                  <span className="text-xs">Location coordinates are missing for this asset.</span>
                </div>
              )}
            </div>
          </section>

          {/* Narrative */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-primary border-b border-border/50 pb-2">Narrative</h3>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold text-muted-foreground">Incident Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe exactly what happened in as much detail as possible..."
                className="min-h-[120px] bg-muted/10 border-border/60 resize-y font-medium text-sm leading-relaxed"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </section>

          {/* Impact Assessment */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-primary border-b border-border/50 pb-2">Impact Assessment</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {IMPACT_OPTIONS.map((option) => (
                <div key={option} className="flex items-center space-x-3">
                  <Checkbox 
                    id={`impact-${option}`} 
                    checked={impact.includes(option)}
                    onCheckedChange={(checked) => handleImpactChange(option, checked as boolean)}
                  />
                  <Label htmlFor={`impact-${option}`} className="font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </section>

          {/* Evidence */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-primary border-b border-border/50 pb-2">Evidence</h3>
            <div className="space-y-1 mb-2">
              <span className="text-sm font-semibold text-muted-foreground block">Upload documents, pictures, or videos</span>
            </div>
            <FileUploader
              maxSize={15}
              className="bg-muted/5 border-border/40"
              onUploadComplete={setAttachments}
            />
          </section>

        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 sticky bottom-6 z-10 pt-2">
        <Button variant="outline" className="h-10 px-6 font-semibold" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button 
          className="h-10 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md gap-2"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : <><Send className="h-4 w-4" /> Submit Report</>}
        </Button>
      </div>
    </div>
  )
}
