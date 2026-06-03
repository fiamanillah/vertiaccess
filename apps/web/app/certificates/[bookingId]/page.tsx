// apps/web/app/certificates/[bookingId]/page.tsx
'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Download,
  ShieldCheck,
  FileBadge2,
  Calendar,
  MapPin,
  User,
  Plane,
  FileText,
  Clock,
  Building2,
  Mail,
  Phone,
  Compass,
  Activity,
} from 'lucide-react'
import { Badge } from '@workspace/ui/components/badge'
import { Button } from '@workspace/ui/components/button'
import { Card, CardContent } from '@workspace/ui/components/card'
import { PreviewMap } from '@/components/map/preview-map'
import { bookingService } from '@/services/booking.service'
import type { ConsentCertificate } from '@/services/booking.types'

import {
  DetailItem,
  toGeometryMode,
  toGeometryCenter,
  toPolygonPoints,
  getDisplayStatus,
  extractRadius,
  computeSiteArea,
  formatArea,
} from './components/helpers'
import {
  SecurityPattern,
  SecuritySeal,
  DigitalSignatureBlock,
} from './components/security-elements'
import { CertificateSkeleton } from './components/certificate-skeleton'

export default function CertificatePage() {
  const router = useRouter()
  const params = useParams<{ bookingId: string }>()
  const bookingId = params?.bookingId ?? ''

  const [certificate, setCertificate] =
    React.useState<ConsentCertificate | null>(null)
  const [isLoading, setIsLoading] = React.useState(Boolean(bookingId))
  const [error, setError] = React.useState<string | null>(
    bookingId ? null : 'Missing booking ID',
  )
  const [now, setNow] = React.useState(() => new Date())

  React.useEffect(() => {
    if (!bookingId) return

    let active = true

    bookingService
      .getBookingCertificate(bookingId)
      .then((data) => {
        if (active) {
          setCertificate(data)
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setCertificate(null)
          let message = 'Failed to load certificate'
          if (err instanceof Error) {
            message = err.message
          } else if (err && typeof err === 'object' && 'message' in err) {
            const potentialMessage = (err as Record<string, unknown>).message
            if (typeof potentialMessage === 'string') {
              message = potentialMessage
            }
          }
          setError(message)
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [bookingId])

  React.useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 30000)
    return () => window.clearInterval(interval)
  }, [])

  const displayStatus = React.useMemo(
    () => getDisplayStatus(certificate, now),
    [certificate, now],
  )

  const displayStatusClasses = React.useMemo(() => {
    if (displayStatus === 'VALID')
      return 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/10'
    if (displayStatus === 'REVOKED')
      return 'bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/10'
    if (displayStatus === 'EXPIRED')
      return 'bg-amber-500/10 text-amber-700 border-amber-500/30 hover:bg-amber-500/10'
    return 'bg-muted text-muted-foreground border-border hover:bg-muted'
  }, [displayStatus])

  const handleDownloadPdf = React.useCallback(() => {
    window.print()
  }, [])

  const mapCenter = React.useMemo(
    () => toGeometryCenter(certificate?.siteGeometry),
    [certificate?.siteGeometry],
  )
  const toalMode = React.useMemo(
    () => toGeometryMode(certificate?.siteGeometry),
    [certificate?.siteGeometry],
  )
  const toalPoints = React.useMemo(
    () =>
      toPolygonPoints(
        certificate?.siteGeometry as { points?: unknown } | null | undefined,
      ),
    [certificate?.siteGeometry],
  )
  const emergencyMode = React.useMemo(
    () => toGeometryMode(certificate?.clzGeometry),
    [certificate?.clzGeometry],
  )
  const emergencyPoints = React.useMemo(
    () =>
      toPolygonPoints(
        certificate?.clzGeometry as { points?: unknown } | null | undefined,
      ),
    [certificate?.clzGeometry],
  )

  // Derived geometry values
  const siteRadius = React.useMemo(
    () => (certificate ? extractRadius(certificate) : null),
    [certificate],
  )
  const siteArea = React.useMemo(
    () => (certificate ? computeSiteArea(certificate) : null),
    [certificate],
  )

  if (isLoading) {
    return <CertificateSkeleton />
  }

  if (error || !certificate) {
    return (
      <div className="min-h-screen bg-muted/20 p-6">
        <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center gap-4 text-center">
          <div className="rounded-full bg-destructive/10 p-4 text-destructive">
            <ShieldCheck className="h-12 w-12" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            Consent certificate unavailable
          </h1>
          <p className="text-sm text-muted-foreground max-w-md">
            {error ?? 'No certificate data was returned for this booking.'}
          </p>
          <Button
            onClick={() => router.push('/dashboard/operator/bookings')}
            className="mt-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to bookings
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @media print {
          /* Force standard light theme color scheme on document root & body */
          html, body, html.dark, body.dark, .dark {
            background-color: #ffffff !important;
            background: #ffffff !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            margin: 0 !important;
            padding: 0 !important;
            font-size: 11px !important;
          }

          /* Override all dark utility classes dynamically */
          [class*="dark:"] {
            background-color: transparent !important;
            color: #0f172a !important;
            border-color: #e2e8f0 !important;
          }

          .no-print {
            display: none !important;
          }

          @page {
            size: A4 portrait;
            margin: 10mm 12mm 10mm 12mm;
          }

          .certificate-shell {
            border: 1px solid #cbd5e1 !important;
            border-radius: 20px !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            background-color: #ffffff !important;
            background: #ffffff !important;
          }

          /* Force exact 2-column layout in print to match web view precisely */
          .print-grid {
            display: grid !important;
            grid-template-columns: repeat(12, minmax(0, 1fr)) !important;
            gap: 1.5rem !important;
          }
          .print-col-left {
            grid-column: span 7 / span 7 !important;
          }
          .print-col-right {
            grid-column: span 5 / span 5 !important;
          }

          section, .signature-block, tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .text-muted-foreground {
            color: #475569 !important;
          }
          .text-foreground {
            color: #0f172a !important;
          }

          /* Print color backgrounds override */
          .bg-muted, .bg-muted\/20, .bg-muted\/30, .bg-muted\/40 {
            background-color: #f8fafc !important;
            background: #f8fafc !important;
          }

          .bg-primary\/10, .bg-primary\/5 {
            background-color: #f0f9ff !important;
            background: #f0f9ff !important;
            color: #0284c7 !important;
          }

          .bg-emerald-500\/10 {
            background-color: #ecfdf5 !important;
            background: #ecfdf5 !important;
            color: #059669 !important;
          }

          .bg-destructive\/10 {
            background-color: #fef2f2 !important;
            background: #fef2f2 !important;
            color: #dc2626 !important;
          }

          .bg-amber-500\/10 {
            background-color: #fffbeb !important;
            background: #fffbeb !important;
            color: #d97706 !important;
          }

          /* Keep maps visible in print preview with border outline */
          .leaflet-container {
            border: 1px solid #cbd5e1 !important;
            filter: grayscale(10%) !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-muted/20 pb-24 md:pb-12">
        <div className="mx-auto w-full max-w-6xl p-4 md:p-8">
          {/* Action Header */}
          <div className="no-print mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                <span>Certificates</span>
                <span>/</span>
                <span className="text-foreground">
                  {certificate.bookingVaId}
                </span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-foreground">
                CONSENT CERTIFICATE
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push('/dashboard/operator/bookings')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back To Bookings
              </Button>
              <Button size="lg" onClick={handleDownloadPdf}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </div>

          {/* Certificate Shell */}
          <Card className="certificate-shell overflow-hidden border border-border bg-card shadow-xl rounded-3xl p-0">
            {/* Premium Header Block */}
            <div className="relative overflow-hidden bg-muted/40 border-b border-border text-foreground p-8 md:p-10 print:p-8">
              <SecurityPattern />

              {/* Top Accent Line */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-primary" />

              <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
                <div className="space-y-5 flex-1">
                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/50 px-3 py-1 backdrop-blur-sm">
                      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[8px] font-black text-primary-foreground">
                        ✓
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground/90">
                        {certificate.platformName} Verified
                      </span>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/50 px-3 py-1 backdrop-blur-sm">
                      <FileBadge2 className="h-3.5 w-3.5 text-primary" />
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground/90">
                        {certificate.certificateType.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="space-y-2">
                    <h1 className="text-3xl font-black uppercase tracking-tight md:text-4xl print:text-3xl leading-none text-foreground">
                      Digital Consent
                      <span className="block text-primary mt-1">
                        Certificate
                      </span>
                    </h1>
                    <p className="text-xs font-medium text-muted-foreground max-w-xl leading-relaxed">
                      This document certifies that digital takeoff and landing
                      consent has been formally granted by the verified
                      landowner authority for the specified operation window.
                    </p>
                  </div>

                  {/* Meta Grid */}
                  <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-border">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                        Certificate ID
                      </p>
                      <p className="text-sm font-mono font-bold text-foreground mt-0.5">
                        {certificate.vaId}
                      </p>
                    </div>
                    <div className="hidden h-8 w-px bg-border sm:block" />
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                        Booking Reference
                      </p>
                      <p className="text-sm font-mono font-bold text-foreground mt-0.5">
                        {certificate.bookingVaId}
                      </p>
                    </div>
                    <div className="hidden h-8 w-px bg-border sm:block" />
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                        Issue Date
                      </p>
                      <p className="text-sm font-bold text-foreground mt-0.5">
                        {format(new Date(certificate.issueDate), 'dd MMM yyyy')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status Badge & Seal */}
                <div className="flex flex-row items-center gap-4 md:flex-col md:items-end shrink-0">
                  <SecuritySeal />
                  <Badge
                    className={`h-10 border px-5 text-[11px] font-black uppercase tracking-widest shadow-sm rounded-full print:h-8 print:px-4 print:text-[10px] ${displayStatusClasses}`}
                  >
                    <ShieldCheck className="mr-1.5 h-4 w-4" />
                    {displayStatus}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Certificate Content Grid */}
            <CardContent className="p-6 md:p-10 print:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print-grid">
                {/* Left Column: Validity, Site Details, Map */}
                <div className="lg:col-span-7 space-y-8 print-col-left">
                  {/* Section: Validity Window */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                      <Calendar className="h-4 w-4 text-primary" />
                      <h2 className="text-xs font-black uppercase tracking-[0.18em] text-foreground">
                        Validity Window & Permissions
                      </h2>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 bg-muted/20 rounded-2xl p-5 border border-border/50">
                      <DetailItem
                        label="Start Time"
                        value={format(
                          new Date(certificate.startTime),
                          'dd MMM yyyy, HH:mm',
                        )}
                        emphasize
                        icon={<Clock className="h-3.5 w-3.5" />}
                      />
                      <DetailItem
                        label="End Time"
                        value={format(
                          new Date(certificate.endTime),
                          'dd MMM yyyy, HH:mm',
                        )}
                        emphasize
                        icon={<Clock className="h-3.5 w-3.5" />}
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <DetailItem
                        label="Use Category"
                        value={certificate.useCategory
                          .replace('_', ' ')
                          .toUpperCase()}
                        icon={<Compass className="h-3.5 w-3.5" />}
                      />
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground/80 flex items-center gap-1.5 mb-1.5">
                          Permitted Activities
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {certificate.permittedActivities.map(
                            (activity, idx) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="text-[10px] font-bold px-2.5 py-0.5 bg-muted text-muted-foreground border-none"
                              >
                                {activity}
                              </Badge>
                            ),
                          )}
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Section: Site Details */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                      <MapPin className="h-4 w-4 text-primary" />
                      <h2 className="text-xs font-black uppercase tracking-[0.18em] text-foreground">
                        Site & Location Details
                      </h2>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <DetailItem
                        label="Site Name"
                        value={certificate.siteName}
                      />
                      <DetailItem
                        label="Site Type"
                        value={certificate.siteType.toUpperCase()}
                      />
                      <div className="sm:col-span-2">
                        <DetailItem
                           label="Site Address"
                           value={certificate.siteAddress}
                        />
                      </div>
                      <DetailItem
                        label="Radius Limit"
                        value={
                          siteRadius !== null ? `${siteRadius} meters` : 'N/A'
                        }
                      />
                      <DetailItem
                        label="Total Area"
                        value={siteArea !== null ? formatArea(siteArea) : 'N/A'}
                      />
                    </div>
                  </section>

                  {/* Section: Site Map */}
                  <section className="space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                      <Compass className="h-4 w-4 text-primary" />
                      <h2 className="text-xs font-black uppercase tracking-[0.18em] text-foreground">
                        Geofenced Boundaries
                      </h2>
                    </div>
                    <div className="overflow-hidden rounded-2xl border border-border/50 bg-muted/20 p-2 shadow-inner">
                      <PreviewMap
                        center={mapCenter}
                        toalRadius={
                          typeof (certificate.siteGeometry as { radius?: unknown })?.radius ===
                          'number'
                            ? (certificate.siteGeometry as { radius: number }).radius
                            : 100
                        }
                        emergencyRadius={
                          typeof (certificate.clzGeometry as { radius?: unknown })?.radius ===
                          'number'
                            ? (certificate.clzGeometry as { radius: number }).radius
                            : 0
                        }
                        showEmergency={Boolean(certificate.clzGeometry)}
                        toalMode={toalMode}
                        emergencyMode={emergencyMode}
                        initialToalPolygonPoints={toalPoints}
                        initialEmergencyPolygonPoints={emergencyPoints}
                        className="overflow-hidden rounded-xl h-[260px] w-full"
                      />
                    </div>
                  </section>
                </div>

                {/* Right Column: Operator, Landowner, Security */}
                <div className="lg:col-span-5 space-y-8 print-col-right">
                  {/* Section: Operator & Mission */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                      <User className="h-4 w-4 text-primary" />
                      <h2 className="text-xs font-black uppercase tracking-[0.18em] text-foreground">
                        Operator & Mission Profile
                      </h2>
                    </div>

                    <div className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <DetailItem
                          label="Operator Name"
                          value={certificate.operatorName}
                          icon={<User className="h-3.5 w-3.5" />}
                        />
                        <DetailItem
                          label="Flyer ID"
                          value={certificate.flyerId ?? 'N/A'}
                          icon={<FileText className="h-3.5 w-3.5" />}
                        />
                        <DetailItem
                          label="Drone Model"
                          value={certificate.droneModel}
                          icon={<Plane className="h-3.5 w-3.5" />}
                        />
                        <DetailItem
                          label="Manufacture"
                          value={certificate.manufacturer ?? 'N/A'}
                          icon={<Building2 className="h-3.5 w-3.5" />}
                        />
                        <DetailItem
                          label="Airframe"
                          value={certificate.airframe ?? 'N/A'}
                          icon={<Activity className="h-3.5 w-3.5" />}
                        />
                        <DetailItem
                          label="Maximum Take-off Weight (MTOW)"
                          value={certificate.mtow ?? 'N/A'}
                          icon={<Compass className="h-3.5 w-3.5" />}
                        />
                        <DetailItem
                          label="Operation Ref"
                          value={certificate.operationReference}
                          icon={<FileText className="h-3.5 w-3.5" />}
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2 border-t border-border/50 pt-4">
                        <DetailItem
                          label="Organisation"
                          value={certificate.operatorOrganisation ?? 'N/A'}
                          icon={<Building2 className="h-3.5 w-3.5" />}
                        />
                        <DetailItem
                          label="Operator Email"
                          value={certificate.operatorEmail}
                          icon={<Mail className="h-3.5 w-3.5" />}
                        />
                      </div>

                      <div className="rounded-xl bg-muted/20 p-4 border border-border/50">
                        <span className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground/80 block mb-1.5">
                          Mission Intent
                        </span>
                        <p className="text-xs font-medium text-foreground/80 italic leading-relaxed">
                          &ldquo;{certificate.missionIntent}&rdquo;
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Section: Landowner Authority */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      <h2 className="text-xs font-black uppercase tracking-[0.18em] text-foreground">
                        Landowner Authority
                      </h2>
                    </div>

                    <div className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <DetailItem
                          label="Landowner Name"
                          value={certificate.landownerName}
                          icon={<User className="h-3.5 w-3.5" />}
                        />
                        <DetailItem
                          label="Landowner Email"
                          value={certificate.landownerEmail}
                          icon={<Mail className="h-3.5 w-3.5" />}
                        />
                        <div className="sm:col-span-2">
                          <DetailItem
                            label="Landowner Phone"
                            value={certificate.landownerPhone}
                            icon={<Phone className="h-3.5 w-3.5" />}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 rounded-xl bg-primary/5 border border-primary/10 p-3.5">
                        <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-xs font-bold text-primary">
                          {certificate.authorityDeclaration
                            ? 'Landowner authority confirmed & digitally signed.'
                            : 'Landowner authority confirmation is pending.'}
                        </span>
                      </div>
                    </div>
                  </section>

                  {/* Section: Security & Verification */}
                  <section className="space-y-4 pt-4 border-t border-border/50">
                    <DigitalSignatureBlock vaId={certificate.vaId} />

                    <div className="grid gap-3 sm:grid-cols-2 text-[10px] text-muted-foreground/80">
                      <div>
                        <span className="font-bold block">
                          Site Status At Issue
                        </span>
                        <span className="text-foreground font-semibold">
                          {certificate.siteStatusAtIssue}
                        </span>
                      </div>
                      <div>
                        <span className="font-bold block">
                          Generated Timestamp
                        </span>
                        <span className="text-foreground font-semibold">
                          {format(
                            new Date(certificate.createdAt),
                            'dd MMM yyyy, HH:mm',
                          )}
                        </span>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </CardContent>

            {/* Premium Footer */}
            <div className="border-t border-border bg-muted/20 px-8 py-6 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-[10px] text-muted-foreground font-medium">
                This certificate is cryptographically secured and registered on
                the {certificate.platformName} platform. Any unauthorized
                alteration invalidates this document.
              </p>
              <p className="text-[10px] font-mono font-bold text-muted-foreground shrink-0">
                ID: {certificate.vaId}
              </p>
            </div>
          </Card>
        </div>

        {/* Mobile Action Bar */}
        <div className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 backdrop-blur md:hidden">
          <div className="mx-auto flex w-full max-w-6xl items-center gap-2">
            <Button
              variant="outline"
              className="h-11 flex-1 font-bold text-xs border-border"
              onClick={() => router.push('/dashboard/operator/bookings')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              className="h-11 flex-1 font-bold text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={handleDownloadPdf}
            >
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
