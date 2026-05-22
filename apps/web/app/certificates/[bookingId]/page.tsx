// apps/web/app/certificates/[bookingId]/page.tsx
'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ArrowLeft, Download, ShieldCheck, FileBadge2 } from 'lucide-react'
import { Badge } from '@workspace/ui/components/badge'
import { Button } from '@workspace/ui/components/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
}

function DetailItem({ label, value, emphasize = false }: DetailItemProps) {
  return (
    <div className="flex flex-col gap-1 print:gap-0">
      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground print:text-[8px]">
        {label}
      </span>
      <span
        className={
          emphasize
            ? 'text-xl font-black leading-tight text-foreground print:text-lg'
            : 'text-sm font-semibold leading-snug text-foreground print:text-xs'
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

function formatGeometrySize(value: string): string {
  if (!value) return 'N/A'
  return value
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
      return 'bg-emerald-100 text-emerald-800 border-emerald-500'
    if (displayStatus === 'REVOKED')
      return 'bg-red-100 text-red-800 border-red-500'
    if (displayStatus === 'EXPIRED')
      return 'bg-red-100 text-red-800 border-red-500'
    return 'bg-amber-100 text-amber-800 border-amber-500'
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

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm font-semibold text-muted-foreground">
          Loading consent certificate…
        </p>
      </div>
    )
  }

  if (error || !certificate) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center gap-4 text-center">
          <h1 className="text-3xl font-black tracking-tight">
            Consent certificate unavailable
          </h1>
          <p className="text-sm text-muted-foreground">
            {error ?? 'No certificate data was returned for this booking.'}
          </p>
          <Button onClick={() => router.push('/dashboard/operator/bookings')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to bookings
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`\n        @media print {\n          body {\n            background: #ffffff !important;\n            -webkit-print-color-adjust: exact;\n            print-color-adjust: exact;\n            margin: 0;\n            padding: 0;\n          }\n\n          .no-print { display: none !important; }\n\n          @page {\n            size: A4;\n            margin: 5mm;\n          }\n\n          .certificate-shell {\n            border: 1px solid #e5e7eb !important;\n            border-radius: 0 !important;\n            box-shadow: none !important;\n            margin: 0 !important;\n            width: 100% !important;\n            height: auto !important;\n            font-size: 12px !important;\n          }\n\n          section { page-break-inside: avoid; }\n\n          .text-muted-foreground { color: #6b7280 !important; }\n        }\n      `}</style>

      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 pb-24 md:pb-10">
        <div className="mx-auto w-full max-w-6xl p-4 md:p-8">
          <div className="no-print mb-8 flex justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-black uppercase tracking-tighter text-foreground">
                Consent Certificate
              </h1>
              <p className="text-sm font-semibold text-muted-foreground">
                Booking Reference{' '}
                <span className="font-black text-foreground">
                  {certificate.bookingVaId}
                </span>
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                variant="outline"
                size="sm"
                className="font-black text-[10px] uppercase tracking-widest"
                onClick={() => router.push('/dashboard/operator/bookings')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back To Bookings
              </Button>
              <Button
                size="sm"
                className="font-black text-[10px] uppercase tracking-widest"
                onClick={handleDownloadPdf}
              >
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </div>

          <Card className="certificate-shell overflow-hidden border border-border/50 bg-background shadow-lg print:border-none print:shadow-none p-0">
            <CardHeader className="border-b border-border/40 bg-gradient-to-br from-muted/50 to-muted/30 p-6 md:p-8 print:bg-muted/5 print:border-b">
              <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between print:flex print:flex-col print:gap-8 print:items-start">
                <div className="min-w-0 flex-1 space-y-6 print:space-y-3">
                  <div className="flex flex-wrap items-center gap-3 print:gap-2">
                    <div className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1.5">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded border border-primary/40 bg-primary/15 text-[8px] font-black text-primary">
                        VA
                      </span>
                      <span className="text-[8px] font-black uppercase tracking-[0.22em] text-primary">
                        {certificate.platformName}
                      </span>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-lg border border-border/40 bg-background px-2.5 py-1.5 shadow-sm">
                      <FileBadge2 className="h-3.5 w-3.5 text-primary" />
                      <span className="text-[8px] font-black uppercase tracking-[0.22em] text-foreground">
                        {certificate.certificateType.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4 print:space-y-3">
                    <CardTitle className="text-3xl font-black uppercase tracking-tight text-foreground md:text-4xl print:text-2xl print:leading-tight">
                      {certificate.platformName}
                      <br />
                      Consent Certificate
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-6 print:grid print:grid-cols-2 print:gap-x-4 print:gap-y-0">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground/60 print:text-[8px]">
                          Issue Date
                        </p>
                        <p className="text-sm font-black text-foreground print:text-xs">
                          {format(
                            new Date(certificate.issueDate),
                            'dd MMM yyyy',
                          )}
                        </p>
                      </div>
                      <div className="hidden h-8 w-px bg-border/40 sm:block print:hidden" />
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground/60 print:text-[8px]">
                          Certificate ID
                        </p>
                        <p className="text-sm font-black text-foreground print:text-xs">
                          {certificate.vaId}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-6 md:items-end md:pt-0 print:gap-3 print:items-start print:pt-0">
                  <Badge
                    className={`h-10 border-2 px-6 text-[10px] font-black uppercase tracking-wider shadow-md print:h-7 print:px-3 print:text-[8px] print:shadow-none ${displayStatusClasses}`}
                  >
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    {displayStatus}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 p-5 md:p-8 print:flex print:flex-col print:gap-y-6 print:p-6">
              <div className="space-y-6 print:space-y-4">
                <section className="space-y-3 print:space-y-1">
                  <h2 className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground print:text-[10px]">
                    Authority Declaration
                  </h2>
                  <p className="text-sm leading-relaxed print:text-[11px] print:leading-normal">
                    {certificate.authorityDeclaration
                      ? 'Site authority confirms consent for the booked operation window and mission intent listed below.'
                      : 'Site authority confirmation is pending for this booking.'}
                  </p>
                </section>

                <section className="space-y-3 border-t border-border/40 pt-4 print:space-y-1 print:pt-3">
                  <h2 className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground print:text-[10px]">
                    Validity Window
                  </h2>
                  <div className="grid gap-3 md:grid-cols-3 print:grid-cols-2 print:gap-x-4 print:gap-y-2">
                    <DetailItem
                      label="Start"
                      value={format(
                        new Date(certificate.startTime),
                        'dd MMM yyyy, HH:mm',
                      )}
                      emphasize
                    />
                    <DetailItem
                      label="End"
                      value={format(
                        new Date(certificate.endTime),
                        'dd MMM yyyy, HH:mm',
                      )}
                      emphasize
                    />
                    <DetailItem
                      label="Use Category"
                      value={certificate.useCategory.replace('_', ' ')}
                    />
                  </div>
                  <DetailItem
                    label="Permitted Activities"
                    value={certificate.permittedActivities.join(', ')}
                  />
                </section>

                <section className="space-y-3 border-t border-border/40 pt-4 print:space-y-1 print:pt-3">
                  <h2 className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground print:text-[10px]">
                    Site Details
                  </h2>
                  <div className="grid gap-3 md:grid-cols-2 print:gap-x-4 print:gap-y-2">
                    <DetailItem
                      label="Site Name"
                      value={certificate.siteName}
                    />
                    <DetailItem
                      label="Site Type"
                      value={certificate.siteType}
                    />
                    <DetailItem
                      label="Site Address"
                      value={certificate.siteAddress}
                    />
                    <DetailItem
                      label="Total Area"
                      value={formatGeometrySize(certificate.siteGeometrySize)}
                    />
                  </div>
                </section>

                <section className="space-y-3 border-t border-border/40 pt-4 print:space-y-1 print:pt-3">
                  <h2 className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground print:text-[10px]">
                    Site Map
                  </h2>
                  <div className="rounded-2xl border border-border/40 bg-muted/10 p-3">
                    <PreviewMap
                      center={mapCenter}
                      toalRadius={
                        typeof (certificate.siteGeometry as any)?.radius ===
                        'number'
                          ? (certificate.siteGeometry as any).radius
                          : 100
                      }
                      emergencyRadius={
                        typeof (certificate.clzGeometry as any)?.radius ===
                        'number'
                          ? (certificate.clzGeometry as any).radius
                          : 0
                      }
                      showEmergency={Boolean(certificate.clzGeometry)}
                      toalMode={toalMode}
                      emergencyMode={emergencyMode}
                      initialToalPolygonPoints={toalPoints}
                      initialEmergencyPolygonPoints={emergencyPoints}
                      className="overflow-hidden rounded-xl"
                    />
                  </div>
                </section>

                <section className="space-y-3 border-t border-border/40 pt-4 print:space-y-1 print:pt-3">
                  <h2 className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground print:text-[10px]">
                    Operator And Mission
                  </h2>
                  <div className="grid gap-3 md:grid-cols-2 print:gap-x-4 print:gap-y-2">
                    <DetailItem
                      label="Operator"
                      value={certificate.operatorName}
                    />
                    <DetailItem
                      label="Flyer ID"
                      value={certificate.flyerId ?? 'N/A'}
                    />
                    <DetailItem
                      label="Drone Model"
                      value={certificate.droneModel}
                    />
                    <DetailItem
                      label="Operation Ref"
                      value={certificate.operationReference}
                    />
                    <DetailItem
                      label="Organisation"
                      value={certificate.operatorOrganisation ?? 'N/A'}
                    />
                    <DetailItem
                      label="Operator Email"
                      value={certificate.operatorEmail}
                    />
                  </div>
                  <DetailItem
                    label="Mission Intent"
                    value={certificate.missionIntent}
                  />
                </section>

                <section className="grid gap-3 border-t border-border/40 pt-4 md:grid-cols-2 print:grid-cols-1 print:gap-y-1 print:pt-3">
                  <DetailItem
                    label="Issue Date"
                    value={format(
                      new Date(certificate.issueDate),
                      'dd MMM yyyy, HH:mm',
                    )}
                  />
                  <DetailItem
                    label="Site Status At Issue"
                    value={certificate.siteStatusAtIssue}
                  />
                </section>

                <section className="space-y-3 border-t border-border/40 pt-4 print:space-y-1 print:pt-3">
                  <h2 className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground print:text-[10px]">
                    Landowner Authority
                  </h2>
                  <div className="grid gap-3 md:grid-cols-3 print:grid-cols-1 print:gap-y-2">
                    <DetailItem
                      label="Landowner"
                      value={certificate.landownerName}
                    />
                    <DetailItem
                      label="Landowner Email"
                      value={certificate.landownerEmail}
                    />
                    <DetailItem
                      label="Landowner Phone"
                      value={certificate.landownerPhone}
                    />
                  </div>
                </section>

                <div className="print:pt-4">
                  <p className="text-[11px] text-muted-foreground print:text-[9px]">
                    Generated:{' '}
                    {format(
                      new Date(certificate.createdAt),
                      'dd MMM yyyy, HH:mm',
                    )}{' '}
                    | Certificate ID: {certificate.vaId}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-border/40 bg-background/95 p-3 backdrop-blur md:hidden">
          <div className="mx-auto flex w-full max-w-6xl items-center gap-2">
            <Button
              variant="outline"
              className="h-11 flex-1 font-black text-[10px] uppercase tracking-widest"
              onClick={() => router.push('/dashboard/operator/bookings')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              className="h-11 flex-1 font-black text-[10px] uppercase tracking-widest"
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
