'use client'

import * as React from 'react'
import { format, parseISO } from 'date-fns'
import { UseFormReturn } from 'react-hook-form'
import {
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  MapPin,
  Calendar as CalendarIcon,
  Banknote,
  FileText,
  Gavel,
  Image as ImageIcon,
  Building2,
  AlertTriangle,
  Scale,
  Download,
  Info,
} from 'lucide-react'

import { Button } from '@workspace/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'
import { Separator } from '@workspace/ui/components/separator'
import { Badge } from '@workspace/ui/components/badge'
import { Checkbox } from '@workspace/ui/components/checkbox'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip'
import { cn } from '@workspace/ui/lib/utils'
import { PreviewMap } from '@/components/map/preview-map'
import { FormValues, UploadedFileMetadata } from '../../schema'
import {
  generateGeoJSONFeature,
  downloadGeoJSONFile,
} from '@/lib/geojson-utils'

interface SiteReviewFormProps {
  form: UseFormReturn<FormValues>
  isLoading: boolean
  onSubmit: () => void
  onPrev: () => void
  onJumpToStep: (step: number) => void
  editModeStatus?: 'active' | 'pending' | 'rejected'
}

function InfoTooltip({ content }: { content: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-3.5 w-3.5 cursor-help text-muted-foreground/60 transition-colors hover:text-muted-foreground" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-60 text-center">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function ReviewSection({
  title,
  icon: Icon,
  tooltip,
  children,
  onEdit,
  step,
}: {
  title: string
  icon: React.ElementType
  tooltip?: string
  children: React.ReactNode
  onEdit: () => void
  step: number
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border/60 bg-background shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-border/40 px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20">
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-bold tracking-tight text-foreground">
              {title}
            </h3>
            {tooltip && <InfoTooltip content={tooltip} />}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="h-7 rounded-full px-2.5 text-[10px] uppercase tracking-wider text-muted-foreground"
          >
            Step {step}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground transition-all hover:bg-primary/5 hover:text-primary"
            onClick={onEdit}
          >
            Edit
          </Button>
        </div>
      </div>
      <div className="px-4 py-3.5">{children}</div>
    </section>
  )
}

function InfoRow({
  label,
  value,
  fullWidth,
  tooltip,
}: {
  label: string
  value: React.ReactNode
  fullWidth?: boolean
  tooltip?: string
}) {
  const isEmpty = value === null || value === undefined || value === ''

  return (
    <div
      className={cn(
        'rounded-xl border border-border/50 bg-muted/20 px-3.5 py-2.5',
        fullWidth && 'col-span-2',
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </span>
        {tooltip && <InfoTooltip content={tooltip} />}
      </div>
      <div className="mt-1.5 min-h-5 text-sm leading-6 text-foreground/80">
        {isEmpty ? (
          <span className="text-xs italic text-muted-foreground/70">
            Not provided
          </span>
        ) : (
          value
        )}
      </div>
    </div>
  )
}

function SummaryGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
}

function PhotoStrip({ urls }: { urls?: (string | UploadedFileMetadata)[] }) {
  if (!urls || urls.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-dashed border-border/60 bg-muted/10 px-4 py-3 text-xs italic text-muted-foreground">
        <ImageIcon className="h-3.5 w-3.5" />
        No photos uploaded
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 pt-1 sm:grid-cols-3 lg:grid-cols-4">
      {urls.map((file, index) => (
        <div
          key={typeof file === 'string' ? file : (file.fileKey ?? index)}
          className="group relative aspect-square overflow-hidden rounded-xl border border-border/50 bg-muted shadow-sm transition-all duration-200 hover:shadow-md"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={typeof file === 'string' ? file : file.url}
            alt={`Photo ${index + 1}`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <Button
              variant="secondary"
              size="sm"
              className="h-7 bg-white/90 text-[10px] font-semibold uppercase tracking-wider text-black hover:bg-white"
              onClick={() =>
                window.open(
                  typeof file === 'string' ? file : file.url,
                  '_blank',
                )
              }
            >
              View Full
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

function DocumentList({
  urls,
  label,
}: {
  urls?: (string | UploadedFileMetadata)[]
  label: string
}) {
  if (!urls || urls.length === 0) {
    return (
      <div className="flex items-center gap-2 text-xs italic text-muted-foreground">
        <FileText className="h-3.5 w-3.5" />
        No {label}s uploaded
      </div>
    )
  }

  return (
    <div className="space-y-2 pt-1">
      {urls.map((file, index) => (
        <div
          key={typeof file === 'string' ? file : (file.fileKey ?? index)}
          className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background p-3 transition-colors hover:border-primary/30"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/5">
              <FileText className="h-4 w-4 text-primary/70" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-foreground/85">
                {typeof file === 'string'
                  ? `${label} #${index + 1}`
                  : file.fileName || `${label} #${index + 1}`}
              </div>
              <div className="truncate font-mono text-[10px] text-muted-foreground">
                {typeof file === 'string'
                  ? file.split('/').pop()?.split('?')[0] || 'document.pdf'
                  : file.fileKey || 'document.pdf'}
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-3 text-[10px] font-semibold hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
            onClick={() =>
              window.open(typeof file === 'string' ? file : file.url, '_blank')
            }
          >
            View Document
          </Button>
        </div>
      ))}
    </div>
  )
}

function formatMoney(value?: number) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value ?? 0)
}

function formatCoordinate(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) return null
  return value.toFixed(5)
}

function formatArea(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) return null
  return `${Math.round(value).toLocaleString()} m²`
}

function formatBoundarySummary({
  mode,
  radius,
  points,
}: {
  mode?: 'circle' | 'polygon'
  radius?: number
  points?: [number, number][]
}) {
  if (!mode) return null

  if (mode === 'polygon') {
    return `${points?.length ?? 0} point${points?.length === 1 ? '' : 's'} defined`
  }

  return `${radius?.toLocaleString() ?? '0'} m radius`
}

function formatActivationWindow(values: FormValues) {
  if (values.isPermanentActivation) {
    return (
      <Badge className="border-none bg-sky-100 text-sky-700 hover:bg-sky-100">
        Permanent
      </Badge>
    )
  }

  const start = values.activationStartDate
    ? (() => {
        try {
          return format(parseISO(values.activationStartDate), 'PPP')
        } catch {
          return values.activationStartDate
        }
      })()
    : null

  const end = values.activationEndDate
    ? (() => {
        try {
          return format(parseISO(values.activationEndDate), 'PPP')
        } catch {
          return values.activationEndDate
        }
      })()
    : null

  const startTime = values.activationStartTime
  const endTime = values.activationEndTime

  if (!start && !end && !startTime && !endTime) return null

  return (
    <div className="space-y-1 text-sm leading-6 text-foreground/80">
      <div>
        {start || 'Not provided'}
        {startTime ? ` at ${startTime}` : ''}
      </div>
      <div>
        {end ? `to ${end}` : 'End date not provided'}
        {endTime ? ` at ${endTime}` : ''}
      </div>
    </div>
  )
}

function formatApproval(model?: FormValues['bookingApprovalModel']) {
  if (model === 'auto') return 'Auto-approval'
  if (model === 'manual') return 'Manual review'
  return null
}

const CATEGORY_LABELS: Record<string, string> = {
  drone_port: 'Drone Port',
  vertiport: 'Vertiport',
  business_park: 'Business Park',
  port_facility: 'Port Facility',
  nhs_facility: 'NHS Facility',
  council_land: 'Council Land',
  private_estate: 'Private Estate',
  logistics_hub: 'Logistics Hub',
  utility_asset: 'Utility Asset',
  transport_infrastructure: 'Transport Infrastructure',
  renewable_energy: 'Renewable and Energy',
  others: 'Others',
  private_land: 'Private Land / Estate',
  helipad: 'Helipad',
  droneport: 'Droneport',
}

function formatCategory(category?: string) {
  if (!category) return null
  return CATEGORY_LABELS[category] || category
}

function formatSiteType(siteType?: string) {
  if (!siteType) return null
  if (siteType === 'toal') return 'Take-off & Landing (TOAL)'
  if (siteType === 'emergency') return 'Emergency & Recovery Site'
  return siteType
}

export function SiteReviewForm({
  form,
  isLoading,
  onSubmit,
  onPrev,
  onJumpToStep,
  editModeStatus,
}: SiteReviewFormProps) {
  const values = form.watch()
  const [termsAccepted, setTermsAccepted] = React.useState(false)
  const [safetyAccepted, setSafetyAccepted] = React.useState(false)
  const [declarationError, setDeclarationError] = React.useState('')

  const handleDownloadGeoJSON = (type: 'toal' | 'emergency') => {
    const mode =
      type === 'toal' ? values.toalGeometryMode : values.emergencyGeometryMode
    const radius = type === 'toal' ? values.toalRadius : values.emergencyRadius
    const points =
      type === 'toal' ? values.toalPolygonPoints : values.emergencyPolygonPoints
    const name =
      type === 'toal'
        ? `${values.name || 'Site'} - TOAL Zone`
        : `${values.name || 'Site'} - Emergency & Recovery Zone`
    const center = {
      lat: values.latitude ?? 51.505,
      lng: values.longitude ?? -0.09,
    }

    const geojson = generateGeoJSONFeature(
      mode as 'circle' | 'polygon',
      center,
      radius || 0,
      points,
      name,
    )

    if (geojson) {
      const filenameType = type === 'toal' ? 'toal' : 'emergency_and_recovery'
      downloadGeoJSONFile(
        `${(values.name || 'site').toLowerCase().replace(/\s+/g, '_')}_${filenameType}_boundary.geojson`,
        geojson,
      )
    }
  }

  const handleSubmit = () => {
    if (!termsAccepted || !safetyAccepted) {
      setDeclarationError(
        'You must agree to all declarations before submitting.',
      )
      return
    }

    setDeclarationError('')
    onSubmit()
  }

  return (
    <div className="flex flex-col w-full space-y-6">
      <div className="relative pb-4 mb-2 border-b border-border/40">
        <div className="pointer-events-none absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="relative z-10">
          <div className="mb-1 flex items-center gap-2">
            <Badge className="h-5 border-none bg-primary/10 px-2 text-[10px] uppercase tracking-wide text-primary">
              Final Step
            </Badge>
          </div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Review & Submit
          </h2>
          <CardDescription className="mt-1">
            Confirm the site details, documents, and declarations before final
            submission.
          </CardDescription>
        </div>
      </div>

      <div>
        <div className="space-y-5">
          <ReviewSection
            title="Site Identity"
            icon={Building2}
            tooltip="Basic identity, contact details, and supporting photos from the first step."
            onEdit={() => onJumpToStep(1)}
            step={1}
          >
            <SummaryGrid>
              <InfoRow label="Site name" value={values.name} />
              <InfoRow label="Category" value={formatCategory(values.category)} />
              <InfoRow label="Primary function" value={formatSiteType(values.siteType)} />
              <InfoRow label="Contact email" value={values.contactEmail} />
              <InfoRow label="Contact phone" value={values.contactPhone} />
              <InfoRow
                label="Description"
                value={values.description}
                fullWidth
                tooltip="The descriptive summary entered earlier."
              />
            </SummaryGrid>
            <div className="mt-4 border-t border-border/30 pt-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Site photos
                </span>
                <InfoTooltip content="These images help confirm the site environment before submission." />
              </div>
              <PhotoStrip urls={values.photoUrls} />
            </div>
          </ReviewSection>

          <ReviewSection
            title="Location & Boundaries"
            icon={MapPin}
            tooltip="Address, coordinates, and the mapped operating boundaries."
            onEdit={() => onJumpToStep(2)}
            step={2}
          >
            <SummaryGrid>
              <InfoRow label="Address" value={values.address} fullWidth />
              <InfoRow label="Postcode" value={values.postcode} />
              <InfoRow
                label="Coordinates"
                value={
                  values.latitude !== undefined &&
                  values.longitude !== undefined
                    ? `${formatCoordinate(values.latitude)}, ${formatCoordinate(values.longitude)}`
                    : null
                }
                tooltip="Latitude and longitude captured from the map step."
              />
              <InfoRow
                label="TOAL boundary"
                value={
                  <div className="space-y-1">
                    <div className="font-medium text-foreground/90">
                      {values.toalGeometryMode === 'polygon'
                        ? 'Polygon'
                        : 'Circle'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatBoundarySummary({
                        mode: values.toalGeometryMode,
                        radius: values.toalRadius,
                        points: values.toalPolygonPoints,
                      })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Area: {formatArea(values.toalAreaM2) || 'Not calculated'}
                    </div>
                  </div>
                }
                tooltip="The planned take-off and landing area."
              />
              <InfoRow
                label="Emergency landing"
                value={
                  values.allowEmergencyLanding ? (
                    <div className="space-y-1">
                      <Badge className="border-none bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                        Enabled
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        {formatBoundarySummary({
                          mode: values.emergencyGeometryMode,
                          radius: values.emergencyRadius,
                          points: values.emergencyPolygonPoints,
                        })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Area:{' '}
                        {formatArea(values.emergencyAreaM2) || 'Not calculated'}
                      </div>
                    </div>
                  ) : (
                    <Badge variant="secondary" className="font-medium">
                      Disabled
                    </Badge>
                  )
                }
                tooltip="Optional emergency and recovery landing settings."
              />
            </SummaryGrid>
            <div className="relative mt-4 overflow-hidden rounded-xl border border-border/40">
              <PreviewMap
                center={{
                  lat: values.latitude ?? 51.505,
                  lng: values.longitude ?? -0.09,
                }}
                toalRadius={values.toalRadius ?? 100}
                emergencyRadius={values.emergencyRadius ?? 350}
                showToal={values.siteType !== 'emergency'}
                showEmergency={values.siteType === 'emergency' || !!values.allowEmergencyLanding}
                toalMode={values.toalGeometryMode ?? 'circle'}
                emergencyMode={values.emergencyGeometryMode ?? 'circle'}
                initialToalPolygonPoints={values.toalPolygonPoints ?? []}
                initialEmergencyPolygonPoints={
                  values.emergencyPolygonPoints ?? []
                }
              />
              <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="xs"
                  variant="secondary"
                  className="pointer-events-auto h-7 cursor-pointer gap-1.5 border bg-background/90 text-[10px] font-semibold uppercase tracking-wider text-indigo-700 shadow-lg backdrop-blur-sm hover:bg-indigo-500/10"
                  onClick={() => handleDownloadGeoJSON('toal')}
                >
                  <Download className="h-3.5 w-3.5" /> Download TOAL
                </Button>
                {values.allowEmergencyLanding && (
                  <Button
                    type="button"
                    size="xs"
                    variant="secondary"
                    className="pointer-events-auto h-7 cursor-pointer gap-1.5 border bg-background/90 text-[10px] font-semibold uppercase tracking-wider text-amber-700 shadow-lg backdrop-blur-sm hover:bg-amber-500/10"
                    onClick={() => handleDownloadGeoJSON('emergency')}
                  >
                    <Download className="h-3.5 w-3.5" /> Download Emergency & Recovery
                  </Button>
                )}
              </div>
            </div>
          </ReviewSection>

          <ReviewSection
            title="Operational Policy"
            icon={CalendarIcon}
            tooltip="The activation window, approval flow, and policy documents."
            onEdit={() => onJumpToStep(3)}
            step={3}
          >
            <SummaryGrid>
              <InfoRow
                label="Activation window"
                value={formatActivationWindow(values)}
                tooltip="The operating schedule configured in the policy step."
              />
              <InfoRow
                label="Booking approval"
                value={formatApproval(values.bookingApprovalModel)}
                tooltip="How booking requests are handled for this site."
              />
            </SummaryGrid>
            <div className="mt-4 border-t border-border/30 pt-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Policy documents
                </span>
                <InfoTooltip content="These files were uploaded for the operating policy step." />
              </div>
              <DocumentList urls={values.policyDocuments} label="Document" />
            </div>
          </ReviewSection>

          <ReviewSection
            title="Pricing & Earnings"
            icon={Banknote}
            tooltip="The landowner fees and the net payout shown here should match the commercial step."
            onEdit={() => onJumpToStep(4)}
            step={4}
          >
            <SummaryGrid>
              {values.siteType !== 'emergency' && (
                <InfoRow
                  label="Access fee"
                  value={formatMoney(values.toalFee)}
                />
              )}
              {(values.siteType === 'emergency' || !!values.allowEmergencyLanding) && (
                <InfoRow
                  label="Emergency access fee"
                  value={formatMoney(values.emergencyFee)}
                />
              )}
              <InfoRow
                label="You receive"
                value={
                  <div className="font-medium text-primary space-y-0.5">
                    {values.siteType !== 'emergency' && (
                      <div>
                        {values.siteType === 'emergency' || !!values.allowEmergencyLanding ? 'Access: ' : ''}
                        {formatMoney((values.toalFee ?? 0) * 0.85)}
                      </div>
                    )}
                    {(values.siteType === 'emergency' || !!values.allowEmergencyLanding) && (
                      <div>
                        {values.siteType !== 'emergency' ? 'Emergency: ' : ''}
                        {formatMoney((values.emergencyFee ?? 0) * 0.85)}
                      </div>
                    )}
                  </div>
                }
                tooltip="Fee is paid unless the operator cancels 24h prior; emergency fee paid only if they land."
              />
            </SummaryGrid>
          </ReviewSection>

          <ReviewSection
            title="Proof of Authority"
            icon={Gavel}
            tooltip="Ownership evidence and the legal declaration required to submit the site."
            onEdit={() => onJumpToStep(5)}
            step={5}
          >
            <SummaryGrid>
              <InfoRow
                label="Legal declaration"
                value={
                  values.legalDeclaration ? (
                    <Badge className="border-none bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                      Confirmed
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="font-medium">
                      Not confirmed
                    </Badge>
                  )
                }
                tooltip="This must be confirmed before the site can be submitted."
              />
              <InfoRow
                label="Ownership documents"
                value={`${values.ownershipDocuments?.length ?? 0} uploaded`}
                tooltip="The number of uploaded proof documents from the previous step."
              />
            </SummaryGrid>
            <div className="mt-4 border-t border-border/30 pt-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Uploaded proof
                </span>
                <InfoTooltip content="Final check of the ownership files uploaded in the authority step." />
              </div>
              <DocumentList
                urls={values.ownershipDocuments}
                label="Ownership proof"
              />
            </div>
          </ReviewSection>

          <Separator />

          <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/30 p-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20">
                <Scale className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-sm font-bold tracking-tight text-foreground">
                  Landowner Declaration
                </h3>
                <span className="text-[9px] font-medium uppercase tracking-widest text-destructive leading-none">
                  Legally binding requirement
                </span>
              </div>
            </div>

            <div className="space-y-4 rounded-xl border border-border/40 bg-background/70 p-4">
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <p className="leading-relaxed">
                  The following declarations are{' '}
                  <strong>legally binding</strong>. Please review each statement
                  carefully before submitting.
                </p>
              </div>

              <div
                className={cn(
                  'flex items-start gap-3 rounded-lg border p-3 transition-colors',
                  termsAccepted
                    ? 'border-primary/20 bg-primary/5 shadow-sm'
                    : 'border-border/50 bg-background',
                )}
              >
                <Checkbox
                  id="terms-declaration"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(!!checked)}
                  disabled={isLoading}
                  className="mt-0.5"
                />
                <label
                  htmlFor="terms-declaration"
                  className="cursor-pointer text-xs leading-relaxed text-foreground/90"
                >
                  I confirm that I have read and agree to the{' '}
                  <span className="cursor-pointer font-semibold text-primary underline underline-offset-2">
                    VertiAccess Landowner Terms &amp; Conditions
                  </span>{' '}
                  and the{' '}
                  <span className="cursor-pointer font-semibold text-primary underline underline-offset-2">
                    Site Registration Policy
                  </span>
                  , and that all information provided in this application is
                  accurate and complete.
                </label>
              </div>

              <div
                className={cn(
                  'flex items-start gap-3 rounded-lg border p-3 transition-colors',
                  safetyAccepted
                    ? 'border-primary/20 bg-primary/5 shadow-sm'
                    : 'border-border/50 bg-background',
                )}
              >
                <Checkbox
                  id="safety-declaration"
                  checked={safetyAccepted}
                  onCheckedChange={(checked) => setSafetyAccepted(!!checked)}
                  disabled={isLoading}
                  className="mt-0.5"
                />
                <label
                  htmlFor="safety-declaration"
                  className="cursor-pointer text-xs leading-relaxed text-foreground/90"
                >
                  I accept full responsibility for the safety of all drone
                  operations on my land, including compliance with{' '}
                  <span className="font-semibold">UK CAA regulations</span> and
                  all applicable local authority requirements. VertiAccess acts
                  solely as an intermediary platform.
                </label>
              </div>

              {declarationError && (
                <p className="flex items-center gap-1.5 text-xs font-medium text-destructive">
                  <AlertTriangle className="h-3 w-3" />
                  {declarationError}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <Button
              variant="ghost"
              type="button"
              onClick={onPrev}
              disabled={isLoading}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Authority
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || !termsAccepted || !safetyAccepted}
              className={cn(
                'min-w-50 gap-2 font-bold shadow-lg transition-all duration-200',
                termsAccepted && safetyAccepted
                  ? 'bg-primary text-primary-foreground shadow-primary/30 hover:bg-primary/90'
                  : 'cursor-not-allowed opacity-60',
              )}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  {editModeStatus === 'active'
                    ? 'Saving Changes...'
                    : 'Submitting...'}
                </span>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  {editModeStatus === 'active'
                    ? 'Save Changes'
                    : editModeStatus === 'rejected'
                      ? 'Resubmit Site'
                      : 'Submit Application'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
