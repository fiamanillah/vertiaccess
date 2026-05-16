'use client'

import * as React from 'react'
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
import { cn } from '@workspace/ui/lib/utils'
import { PreviewMap } from '@/components/map/preview-map'
import { FormValues, UploadedFileMetadata } from '../../schema'

interface SiteReviewFormProps {
  form: UseFormReturn<FormValues>
  isLoading: boolean
  onSubmit: () => void
  onPrev: () => void
  onJumpToStep: (step: number) => void
  editModeStatus?: 'active' | 'pending' | 'rejected'
}

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

function ReviewSection({
  title,
  icon: Icon,
  children,
  onEdit,
  step,
}: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
  onEdit: () => void
  step: number
}) {
  return (
    <div className="group space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20">
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <h3 className="font-bold text-sm tracking-tight">{title}</h3>
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold leading-none">
              Stage {step} Validation
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary hover:bg-primary/5 px-2 transition-all group-hover:bg-primary/5 group-hover:text-primary"
          onClick={onEdit}
        >
          Edit
        </Button>
      </div>
      <div className="bg-muted/20 border border-border/40 rounded-2xl p-5 shadow-sm overflow-hidden backdrop-blur-[2px]">
        {children}
      </div>
    </div>
  )
}

function InfoRow({
  label,
  value,
  fullWidth,
}: {
  label: string
  value: React.ReactNode
  fullWidth?: boolean
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1 py-2.5 border-b border-border/20 last:border-0',
        fullWidth && 'col-span-2',
      )}
    >
      <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">
        {label}
      </span>
      <div className="text-sm font-semibold text-foreground/90 leading-relaxed min-h-[20px] flex items-center">
        {value || (
          <span className="text-muted-foreground font-normal italic text-xs">
            Not provided
          </span>
        )}
      </div>
    </div>
  )
}

function PhotoStrip({ urls }: { urls?: (string | UploadedFileMetadata)[] }) {
  if (!urls || urls.length === 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground italic py-2 px-1">
        <ImageIcon className="h-3.5 w-3.5" />
        No photos uploaded
      </div>
    )
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-3">
      {urls.map((file, i) => (
        <div
          key={i}
          className="group relative aspect-square rounded-xl bg-muted border border-border/50 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={typeof file === 'string' ? file : file.url}
            alt={`Photo ${i + 1}`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            <Button
              variant="secondary"
              size="sm"
              className="h-7 text-[10px] font-bold uppercase tracking-wider bg-white/90 text-black hover:bg-white"
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
      <div className="flex items-center gap-2 text-xs text-muted-foreground italic py-2">
        <FileText className="h-3.5 w-3.5" />
        No {label}s uploaded
      </div>
    )
  }

  return (
    <div className="space-y-2 pt-2">
      {urls.map((file, i) => (
        <div
          key={i}
          className="flex items-center justify-between p-2.5 rounded-lg bg-background border border-border/60 group hover:border-primary/30 transition-colors"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-8 w-8 rounded bg-primary/5 flex items-center justify-center shrink-0">
              <FileText className="h-4 w-4 text-primary/70" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold truncate">
                {typeof file === 'string'
                  ? `${label} #${i + 1}`
                  : file.fileName || `${label} #${i + 1}`}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono truncate">
                {typeof file === 'string'
                  ? file.split('/').pop()?.split('?')[0] || 'document.pdf'
                  : file.fileKey || 'document.pdf'}
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[10px] px-3 font-semibold hover:bg-primary/5 hover:text-primary hover:border-primary/30"
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

/* ─── Main Component ───────────────────────────────────────────────────────── */

export function SiteReviewForm({
  form,
  isLoading,
  onSubmit,
  onPrev,
  onJumpToStep,
  editModeStatus,
}: SiteReviewFormProps) {
  const values = form.getValues()
  const [termsAccepted, setTermsAccepted] = React.useState(false)
  const [safetyAccepted, setSafetyAccepted] = React.useState(false)
  const [declarationError, setDeclarationError] = React.useState('')

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
    <Card className="shadow-md border-border/60">
      <CardHeader className="relative overflow-hidden pb-6 border-b">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-primary/10 text-primary border-none text-[10px] h-5 uppercase tracking-wide">
              Final Step
            </Badge>
          </div>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Review & Submit
          </CardTitle>
          <CardDescription className="mt-1">
            Review all details carefully. This submission is legally binding.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="pt-8">
        <div className="space-y-8">
          {/* ─── Step 1: Site Identity ────────────────────────────── */}
          <ReviewSection
            title="Site Identity"
            icon={Building2}
            onEdit={() => onJumpToStep(1)}
            step={1}
          >
            <div className="grid grid-cols-2 gap-x-6">
              <InfoRow label="Site Name" value={values.name} />
              <InfoRow label="Category" value={values.category} />
              <InfoRow label="Site Type" value={values.siteType} />
              <InfoRow label="Contact Email" value={values.contactEmail} />
              <InfoRow label="Contact Phone" value={values.contactPhone} />
              {values.description && (
                <InfoRow
                  label="Description"
                  value={values.description}
                  fullWidth
                />
              )}
            </div>
            {/* Photos strip */}
            <div className="pt-3">
              <PhotoStrip urls={values.photoUrls} />
            </div>
          </ReviewSection>

          {/* ─── Step 2: Location & Boundary Map ─────────────────── */}
          <ReviewSection
            title="Location & Boundaries"
            icon={MapPin}
            onEdit={() => onJumpToStep(2)}
            step={2}
          >
            <div className="grid grid-cols-2 gap-x-6">
              <InfoRow label="Address" value={values.address} />
              <InfoRow label="Postcode" value={values.postcode} />
              <InfoRow
                label="TOAL Boundary"
                value={`${values.toalGeometryMode === 'circle' ? '⬤ Circle' : '⬡ Polygon'} — ${values.toalRadius}m radius`}
              />
              <InfoRow
                label="Emergency Landing"
                value={
                  values.allowEmergencyLanding ? (
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">
                      Enabled — {values.emergencyRadius}m
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Disabled</Badge>
                  )
                }
              />
            </div>
            <div className="mt-4 rounded-xl overflow-hidden border border-border/40">
              <PreviewMap
                center={{
                  lat: values.latitude || 51.505,
                  lng: values.longitude || -0.09,
                }}
                toalRadius={values.toalRadius || 100}
                emergencyRadius={values.emergencyRadius || 350}
                showEmergency={!!values.allowEmergencyLanding}
                toalMode={values.toalGeometryMode || 'circle'}
                emergencyMode={values.emergencyGeometryMode || 'circle'}
                initialToalPolygonPoints={values.toalPolygonPoints || []}
                initialEmergencyPolygonPoints={
                  values.emergencyPolygonPoints || []
                }
              />
            </div>
          </ReviewSection>

          {/* ─── Step 3: Operational Policy ──────────────────────── */}
          <ReviewSection
            title="Operational Policy"
            icon={CalendarIcon}
            onEdit={() => onJumpToStep(3)}
            step={3}
          >
            <div className="grid grid-cols-2 gap-x-6">
              <InfoRow
                label="Activation Window"
                value={
                  values.isPermanentActivation ? (
                    <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-100 border-none">
                      Permanent
                    </Badge>
                  ) : (
                    `${values.activationStartDate} ${values.activationStartTime} → ${values.activationEndDate} ${values.activationEndTime}`
                  )
                }
              />
              <InfoRow
                label="Booking Approval"
                value={
                  values.bookingApprovalModel === 'auto'
                    ? 'Auto-Approval (Instant)'
                    : 'Manual Review'
                }
              />
            </div>
            <div className="pt-3 border-t border-border/30 mt-3">
              <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">
                Policy Documents
              </span>
              <DocumentList urls={values.policyDocuments} label="Document" />
            </div>
          </ReviewSection>

          {/* ─── Step 4: Commercial Setup ─────────────────────────── */}
          <ReviewSection
            title="Pricing & Earnings"
            icon={Banknote}
            onEdit={() => onJumpToStep(4)}
            step={4}
          >
            <div className="grid grid-cols-2 gap-x-6">
              <InfoRow
                label="TOAL Access Fee"
                value={`£${values.toalFee?.toFixed(2) ?? '0.00'}`}
              />
              <InfoRow
                label="Emergency Access Fee"
                value={`£${values.emergencyFee?.toFixed(2) ?? '0.00'}`}
              />
              <InfoRow
                label="Platform Fee (15%)"
                value={`−£${((values.toalFee ?? 0) * 0.15).toFixed(2)}`}
              />
              <InfoRow
                label="You Receive (Net)"
                value={
                  <span className="font-bold text-primary">
                    £{((values.toalFee ?? 0) * 0.85).toFixed(2)}
                  </span>
                }
              />
            </div>
          </ReviewSection>

          {/* ─── Step 5: Proof of Authority ──────────────────────── */}
          <ReviewSection
            title="Proof of Authority"
            icon={Gavel}
            onEdit={() => onJumpToStep(5)}
            step={5}
          >
            <div className="grid grid-cols-2 gap-x-6">
              <InfoRow
                label="Legal Declaration"
                value={
                  values.legalDeclaration ? (
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none uppercase text-[10px] px-2 h-5">
                      Confirmed
                    </Badge>
                  ) : (
                    <Badge
                      variant="destructive"
                      className="uppercase text-[10px] px-2 h-5"
                    >
                      Not Confirmed
                    </Badge>
                  )
                }
              />
            </div>
            <div className="pt-3 border-t border-border/30 mt-3">
              <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">
                Ownership Documents
              </span>
              <DocumentList
                urls={values.ownershipDocuments}
                label="Ownership Proof"
              />
            </div>
          </ReviewSection>

          <Separator />

          {/* ─── Landowner Declaration ────────────────────────────── */}
          <div className="space-y-4 pt-4 border-t border-border/60">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20">
                <Scale className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <h3 className="font-bold text-sm tracking-tight">
                  Landowner Declaration
                </h3>
                <span className="text-[9px] uppercase tracking-widest text-destructive font-bold leading-none">
                  Legally Binding Requirement
                </span>
              </div>
            </div>

            <div className="bg-muted/30 border border-border/40 rounded-xl p-4 space-y-4">
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <AlertTriangle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  The following declarations are{' '}
                  <strong>legally binding</strong>. Please read carefully before
                  checking each box. Submitting with false declarations may
                  result in legal action.
                </p>
              </div>

              {/* Terms declaration */}
              <div
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg border transition-colors',
                  termsAccepted
                    ? 'bg-primary/5 border-primary/20 shadow-sm'
                    : 'bg-background border-border/50',
                )}
              >
                <Checkbox
                  id="terms-declaration"
                  checked={termsAccepted}
                  onCheckedChange={(v) => setTermsAccepted(!!v)}
                  disabled={isLoading}
                  className="mt-0.5"
                />
                <label
                  htmlFor="terms-declaration"
                  className="text-xs leading-relaxed cursor-pointer text-foreground/90"
                >
                  I confirm that I have read and agree to the{' '}
                  <span className="font-semibold text-primary underline underline-offset-2 cursor-pointer">
                    VertiAccess Landowner Terms & Conditions
                  </span>{' '}
                  and the{' '}
                  <span className="font-semibold text-primary underline underline-offset-2 cursor-pointer">
                    Site Registration Policy
                  </span>
                  , and that all information provided in this application is
                  accurate and complete.
                </label>
              </div>

              {/* Safety responsibility declaration */}
              <div
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg border transition-colors',
                  safetyAccepted
                    ? 'bg-primary/5 border-primary/20 shadow-sm'
                    : 'bg-background border-border/50',
                )}
              >
                <Checkbox
                  id="safety-declaration"
                  checked={safetyAccepted}
                  onCheckedChange={(v) => setSafetyAccepted(!!v)}
                  disabled={isLoading}
                  className="mt-0.5"
                />
                <label
                  htmlFor="safety-declaration"
                  className="text-xs leading-relaxed cursor-pointer text-foreground/90"
                >
                  I accept full responsibility for ensuring the safety of all
                  drone operations on my land, including compliance with{' '}
                  <span className="font-semibold">UK CAA regulations</span> and
                  all applicable local authority requirements. I understand that
                  VertiAccess acts solely as an intermediary platform and holds
                  no liability for on-site incidents.
                </label>
              </div>

              {declarationError && (
                <p className="text-xs text-destructive flex items-center gap-1.5 font-medium">
                  <AlertTriangle className="h-3 w-3" />
                  {declarationError}
                </p>
              )}
            </div>
          </div>

          {/* ─── Footer Actions ────────────────────────────────────── */}
          <div className="flex items-center justify-between pt-6 border-t">
            <Button
              variant="ghost"
              type="button"
              onClick={onPrev}
              disabled={isLoading}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Authority
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || !termsAccepted || !safetyAccepted}
              className={cn(
                'gap-2 font-bold shadow-lg min-w-[200px] transition-all duration-200',
                termsAccepted && safetyAccepted
                  ? 'shadow-primary/30 bg-primary hover:bg-primary/90 text-primary-foreground'
                  : 'opacity-60 cursor-not-allowed',
              )}
              size="lg"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
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
      </CardContent>
    </Card>
  )
}
