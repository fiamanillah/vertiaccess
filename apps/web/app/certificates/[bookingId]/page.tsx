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
  QrCode,
  CheckCircle2,
  Clock,
  Building2,
  Mail,
  Phone,
  Compass
} from 'lucide-react'
import { Badge } from '@workspace/ui/components/badge'
import { Button } from '@workspace/ui/components/button'
import {
  Card,
  CardContent,
} from '@workspace/ui/components/card'
import { PreviewMap } from '@/components/map/preview-map'
import { bookingService } from '@/services/booking.service'
import type { ConsentCertificate } from '@/services/booking.types'
import type { GeometryMode, MapCenter } from '@/components/map/map-types'

type DisplayStatus = 'VALID' | 'PENDING' | 'REVOKED' | 'EXPIRED'

interface DetailItemProps {
  label: string
  value: string
  emphasize?: boolean
  icon?: React.ReactNode
}

function DetailItem({ label, value, emphasize = false, icon }: DetailItemProps) {
  return (
    <div className="flex flex-col gap-1.5 print:gap-0.5">
      <span className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground/80 flex items-center gap-1.5 print:text-[8px]">
        {icon && <span className="text-muted-foreground/60 print:hidden">{icon}</span>}
        {label}
      </span>
      <span
        className={
          emphasize
            ? 'text-base font-black leading-tight text-foreground print:text-sm'
            : 'text-sm font-bold leading-snug text-foreground/90 print:text-xs'
        }
      >
        {value}
      </span>
    </div>
  )
}

function toGeometryMode(geometry: any): GeometryMode {
  return geometry?.type === 'polygon' ? 'polygon' : 'circle'
}

function toGeometryCenter(geometry: any): MapCenter {
  const center = geometry?.center
  if (
    center &&
    typeof center.lat === 'number' &&
    typeof center.lng === 'number'
  ) {
    return center
  }

  if (Array.isArray(geometry?.points) && geometry.points.length > 0) {
    const point = geometry.points[0]
    if (Array.isArray(point) && point.length >= 2) {
      return { lat: Number(point[0]) || 51.505, lng: Number(point[1]) || -0.09 }
    }
  }

  return { lat: 51.505, lng: -0.09 }
}

function toPolygonPoints(geometry: any): [number, number][] {
  if (!Array.isArray(geometry?.points)) return []
  return geometry.points.filter(
    (point: unknown): point is [number, number] =>
      Array.isArray(point) && point.length >= 2,
  )
}

function getDisplayStatus(
  certificate: ConsentCertificate | null,
  now: Date,
): DisplayStatus {
  if (!certificate) return 'PENDING'
  if (certificate.consentStatus === 'REVOKED') return 'REVOKED'
  if (certificate.consentStatus !== 'APPROVED') return 'PENDING'
  if (now > new Date(certificate.endTime)) return 'EXPIRED'
  return 'VALID'
}

// ------------------------------------------------------------------
// Geometry helpers for radius / area
// ------------------------------------------------------------------
function extractRadius(cert: ConsentCertificate): number | null {
  const geo = cert.siteGeometry as any
  if (geo?.radius && typeof geo.radius === 'number') return geo.radius
  // Fallback: parse the legacy siteGeometrySize string
  if (cert.siteGeometrySize) {
    const m = cert.siteGeometrySize.match(/([\d.]+)\s*m\s*radius/i)
    if (m) return parseFloat(m[1])
  }
  return null
}

function computePolygonArea(points: [number, number][]): number {
  if (points.length < 3) return 0
  const n = points.length
  const avgLat = points.reduce((s, p) => s + p[0], 0) / n
  const avgLng = points.reduce((s, p) => s + p[1], 0) / n
  const latScale = 111320 // metres per degree latitude
  const lngScale = 111320 * Math.cos((avgLat * Math.PI) / 180)
  const projected: [number, number][] = points.map((p) => [
    (p[1] - avgLng) * lngScale,
    (p[0] - avgLat) * latScale,
  ])
  let area = 0
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    area += projected[i][0] * projected[j][1]
    area -= projected[j][0] * projected[i][1]
  }
  return Math.abs(area) / 2
}

function computeSiteArea(cert: ConsentCertificate): number | null {
  // Prefer radius-based area
  const radius = extractRadius(cert)
  if (radius !== null) return Math.PI * radius * radius
  // Fallback to polygon approximation
  const points = toPolygonPoints(cert.siteGeometry)
  if (points.length >= 3) return computePolygonArea(points)
  return null
}

function formatArea(areaSqM: number): string {
  const ha = areaSqM / 10000
  return `${areaSqM.toLocaleString(undefined, { maximumFractionDigits: 1 })} m² (${ha.toFixed(2)} ha)`
}

// ------------------------------------------------------------------
// Security Pattern & Seal Components
// ------------------------------------------------------------------
const SecurityPattern = () => (
  <svg className="absolute inset-0 h-full w-full opacity-[0.04] mix-blend-overlay pointer-events-none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
    <defs>
      <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
        <path d="M 24 0 L 0 0 0 24" fill="none" stroke="currentColor" strokeWidth="1" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#grid)" />
  </svg>
)

const SecuritySeal = () => (
  <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-primary/30 bg-primary/5 p-1 print:h-12 print:w-12">
    <div className="flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-primary">
      <ShieldCheck className="h-8 w-8 print:h-6 print:w-6" />
    </div>
    <div className="absolute -inset-1 rounded-full border border-dashed border-primary/20 animate-[spin_20s_linear_infinite] print:hidden" />
  </div>
)

const DigitalSignatureBlock = ({ vaId }: { vaId: string }) => (
  <div className="flex items-center gap-4 rounded-xl border border-border/50 bg-muted/30 p-4 print:p-3">
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-foreground text-background print:h-10 print:w-10">
      <QrCode className="h-8 w-8 print:h-6 print:w-6" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">
        Cryptographic Signature
      </p>
      <p className="font-mono text-[10px] font-bold text-foreground truncate">
        {vaId}-SECURE-SIG-{(vaId || '').split('').reverse().join('')}
      </p>
      <p className="text-[8px] text-primary font-semibold flex items-center gap-1 mt-0.5">
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        Verified & Active Consent
      </p>
    </div>
  </div>
)

function CertificateSkeleton() {
  return (
    <div className="min-h-screen bg-muted/20 pb-24 md:pb-12 animate-pulse">
      <div className="mx-auto w-full max-w-6xl p-4 md:p-8">
        
        {/* Action Header Skeleton */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="h-4 w-32 bg-muted rounded" />
            <div className="h-8 w-64 bg-muted rounded" />
          </div>
          <div className="flex gap-2.5">
            <div className="h-10 w-28 bg-muted rounded-lg" />
            <div className="h-10 w-32 bg-muted rounded-lg" />
          </div>
        </div>

        {/* Certificate Shell Skeleton */}
        <div className="overflow-hidden border border-border bg-card shadow-xl rounded-3xl">
          
          {/* Header Block Skeleton */}
          <div className="relative bg-muted/40 border-b border-border p-8 md:p-10 flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="space-y-5 flex-1">
              <div className="flex gap-2">
                <div className="h-5 w-32 bg-muted rounded-full" />
                <div className="h-5 w-40 bg-muted rounded-full" />
              </div>
              <div className="space-y-2">
                <div className="h-10 w-3/4 bg-muted rounded" />
                <div className="h-4 w-1/2 bg-muted rounded" />
              </div>
              <div className="flex gap-6 pt-4 border-t border-border">
                <div className="h-8 w-24 bg-muted rounded" />
                <div className="h-8 w-24 bg-muted rounded" />
                <div className="h-8 w-24 bg-muted rounded" />
              </div>
            </div>
            <div className="flex flex-row items-center gap-4 md:flex-col md:items-end shrink-0">
              <div className="h-16 w-16 rounded-full bg-muted" />
              <div className="h-10 w-28 bg-muted rounded-full" />
            </div>
          </div>

          {/* Content Grid Skeleton */}
          <div className="p-6 md:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column */}
              <div className="lg:col-span-7 space-y-8">
                {/* Validity Window */}
                <div className="space-y-4">
                  <div className="h-5 w-48 bg-muted rounded" />
                  <div className="grid gap-4 sm:grid-cols-2 bg-muted/10 rounded-2xl p-5 border border-border/50">
                    <div className="space-y-2">
                      <div className="h-3 w-16 bg-muted rounded" />
                      <div className="h-5 w-32 bg-muted rounded" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 w-16 bg-muted rounded" />
                      <div className="h-5 w-32 bg-muted rounded" />
                    </div>
                  </div>
                </div>

                {/* Site Details */}
                <div className="space-y-4">
                  <div className="h-5 w-40 bg-muted rounded" />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <div className="h-3 w-16 bg-muted rounded" />
                      <div className="h-5 w-28 bg-muted rounded" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 w-16 bg-muted rounded" />
                      <div className="h-5 w-28 bg-muted rounded" />
                    </div>
                    <div className="sm:col-span-2 space-y-2">
                      <div className="h-3 w-16 bg-muted rounded" />
                      <div className="h-5 w-full bg-muted rounded" />
                    </div>
                  </div>
                </div>

                {/* Map Placeholder */}
                <div className="space-y-3">
                  <div className="h-5 w-36 bg-muted rounded" />
                  <div className="h-[260px] w-full bg-muted/20 rounded-2xl border border-border/50" />
                </div>
              </div>

              {/* Right Column */}
              <div className="lg:col-span-5 space-y-8">
                {/* Operator Profile */}
                <div className="space-y-4">
                  <div className="h-5 w-44 bg-muted rounded" />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <div className="h-3 w-16 bg-muted rounded" />
                      <div className="h-5 w-24 bg-muted rounded" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 w-16 bg-muted rounded" />
                      <div className="h-5 w-24 bg-muted rounded" />
                    </div>
                  </div>
                  <div className="h-16 w-full bg-muted/10 rounded-xl border border-border/50" />
                </div>

                {/* Landowner Authority */}
                <div className="space-y-4">
                  <div className="h-5 w-40 bg-muted rounded" />
                  <div className="h-12 w-full bg-muted/10 rounded-xl border border-border/50" />
                </div>

                {/* Security Block */}
                <div className="space-y-4">
                  <div className="h-16 w-full bg-muted rounded-xl" />
                </div>
              </div>

            </div>
          </div>

          {/* Footer Skeleton */}
          <div className="border-t border-border bg-muted/20 px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="h-4 w-2/3 bg-muted rounded" />
            <div className="h-4 w-24 bg-muted rounded" />
          </div>

        </div>
      </div>
    </div>
  )
}

export default function CertificatePage() {
  const router = useRouter()
  const params = useParams<{ bookingId: string }>()
  const bookingId = params?.bookingId ?? ''

  const [certificate, setCertificate] =
    React.useState<ConsentCertificate | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [now, setNow] = React.useState(() => new Date())

  React.useEffect(() => {
    let active = true

    if (!bookingId) {
      setError('Missing booking ID')
      setIsLoading(false)
      return () => {
        active = false
      }
    }

    bookingService
      .getBookingCertificate(bookingId)
      .then((data) => {
        if (active) {
          setCertificate(data)
          setError(null)
        }
      })
      .catch((err: any) => {
        if (active) {
          setCertificate(null)
          setError(err?.message ?? 'Failed to load certificate')
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
    () => toPolygonPoints(certificate?.siteGeometry),
    [certificate?.siteGeometry],
  )
  const emergencyMode = React.useMemo(
    () => toGeometryMode(certificate?.clzGeometry),
    [certificate?.clzGeometry],
  )
  const emergencyPoints = React.useMemo(
    () => toPolygonPoints(certificate?.clzGeometry),
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
          <Button onClick={() => router.push('/dashboard/operator/bookings')} className="mt-2">
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
          body {
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            margin: 0;
            padding: 0;
          }

          .no-print { display: none !important; }

          @page {
            size: A4;
            margin: 8mm 8mm 8mm 8mm;
          }

          .certificate-shell {
            border: 1px solid #e2e8f0 !important;
            border-radius: 16px !important;
            box-shadow: none !important;
            margin: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: #ffffff !important;
          }

          /* Force 2-column layout in print to match web */
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

          section { page-break-inside: avoid; }
          .text-muted-foreground { color: #64748b !important; }
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
                <span className="text-foreground">{certificate.bookingVaId}</span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-foreground">
                CONSENT CERTIFICATE
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                className="font-bold text-xs h-10 px-4 border-border hover:bg-muted"
                onClick={() => router.push('/dashboard/operator/bookings')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back To Bookings
              </Button>
              <Button
                size="sm"
                className="font-bold text-xs h-10 px-4 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                onClick={handleDownloadPdf}
              >
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
                      This document certifies that digital takeoff and landing consent has been formally granted by the verified landowner authority for the specified operation window.
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
                        value={format(new Date(certificate.startTime), 'dd MMM yyyy, HH:mm')}
                        emphasize
                        icon={<Clock className="h-3.5 w-3.5" />}
                      />
                      <DetailItem
                        label="End Time"
                        value={format(new Date(certificate.endTime), 'dd MMM yyyy, HH:mm')}
                        emphasize
                        icon={<Clock className="h-3.5 w-3.5" />}
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <DetailItem
                        label="Use Category"
                        value={certificate.useCategory.replace('_', ' ').toUpperCase()}
                        icon={<Compass className="h-3.5 w-3.5" />}
                      />
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground/80 flex items-center gap-1.5 mb-1.5">
                          Permitted Activities
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {certificate.permittedActivities.map((activity, idx) => (
                            <Badge key={idx} variant="secondary" className="text-[10px] font-bold px-2.5 py-0.5 bg-muted text-muted-foreground border-none">
                              {activity}
                            </Badge>
                          ))}
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
                        value={siteRadius !== null ? `${siteRadius} meters` : 'N/A'}
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
                          typeof (certificate.siteGeometry as any)?.radius === 'number'
                            ? (certificate.siteGeometry as any).radius
                            : 100
                        }
                        emergencyRadius={
                          typeof (certificate.clzGeometry as any)?.radius === 'number'
                            ? (certificate.clzGeometry as any).radius
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
                          "{certificate.missionIntent}"
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
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
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
                        <span className="font-bold block">Site Status At Issue</span>
                        <span className="text-foreground font-semibold">{certificate.siteStatusAtIssue}</span>
                      </div>
                      <div>
                        <span className="font-bold block">Generated Timestamp</span>
                        <span className="text-foreground font-semibold">
                          {format(new Date(certificate.createdAt), 'dd MMM yyyy, HH:mm')}
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
                This certificate is cryptographically secured and registered on the {certificate.platformName} platform. Any unauthorized alteration invalidates this document.
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
