'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ArrowLeft, Download, ShieldCheck, FileBadge2 } from 'lucide-react'
import QRCode from 'react-qr-code'
import { Badge } from '@workspace/ui/components/badge'
import { Button } from '@workspace/ui/components/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'

type ConsentStatus = 'issued' | 'pending' | 'revoked'

interface ConsentCertificate {
  id: string
  bookingId: string
  bookingVtId: string
  certificateType: string
  issueDate: string
  platformName: string
  digitalSignature: string
  siteStatusAtIssue: string
  authorityDeclaration: string
  landownerName: string
  landownerEmail: string
  landownerPhone: string
  siteName: string
  siteType: string
  siteAddress: string
  siteGeometrySize: number
  operatorName: string
  operatorOrganisation: string
  operatorEmail: string
  operationReference: string
  flyerId: string
  droneModel: string
  missionIntent: string
  startTime: string
  endTime: string
  permittedActivities: string
  useCategory: string
  consentStatus: ConsentStatus
  createdAt: string
}

const certificateMocks: Record<string, ConsentCertificate> = {
  '1': {
    id: 'cert-1',
    bookingId: '1',
    bookingVtId: 'vt-bkg-123',
    certificateType: 'consent_certificate',
    issueDate: new Date().toISOString(),
    platformName: 'VertiAccess',
    digitalSignature: 'SIG_f45e62ab0cc19044f2a3d127',
    siteStatusAtIssue: 'active',
    authorityDeclaration:
      'Site authority confirms consent for the scheduled operation window and mission intent listed below.',
    landownerName: 'Canary Wharf Estate Authority',
    landownerEmail: 'ops@cw-estate.example',
    landownerPhone: '+44 20 7000 0001',
    siteName: 'Canary Wharf Helipad',
    siteType: 'Commercial',
    siteAddress: 'South Quay, London, E14 9WS',
    siteGeometrySize: 150,
    operatorName: 'Alex Morgan',
    operatorOrganisation: 'Falcon Survey Ltd',
    operatorEmail: 'alex@falconsurvey.example',
    operationReference: 'OPS-2024-001',
    flyerId: 'GBR-RP-123456',
    droneModel: 'DJI Matrice 350 RTK',
    missionIntent: 'Critical structural inspection of helipad infrastructure.',
    startTime: new Date(Date.now() + 86400000).toISOString(),
    endTime: new Date(Date.now() + 90000000).toISOString(),
    permittedActivities:
      'Visual inspection, thermal capture, and orthomosaic capture within approved TOAL boundaries.',
    useCategory: 'planned_toal',
    consentStatus: 'issued',
    createdAt: new Date().toISOString(),
  },
  '3': {
    id: 'cert-3',
    bookingId: '3',
    bookingVtId: 'vt-bkg-125',
    certificateType: 'consent_certificate',
    issueDate: new Date(Date.now() - 172800000).toISOString(),
    platformName: 'VertiAccess',
    digitalSignature: 'SIG_8857ca4f9d0dcf6c2daaf11c',
    siteStatusAtIssue: 'active',
    authorityDeclaration:
      'Emergency consent issued for recovery and urgent survey operation in accordance with local site restrictions.',
    landownerName: 'North Field Holdings',
    landownerEmail: 'estate@northfield.example',
    landownerPhone: '+44 1296 000 221',
    siteName: 'North Field Estate',
    siteType: 'Private Estate',
    siteAddress: 'Aylesbury, Buckinghamshire, HP19 8AL',
    siteGeometrySize: 250,
    operatorName: 'Alex Morgan',
    operatorOrganisation: 'Falcon Survey Ltd',
    operatorEmail: 'alex@falconsurvey.example',
    operationReference: 'OPS-2024-003',
    flyerId: 'GBR-RP-123456',
    droneModel: 'DJI Mavic 3 Enterprise',
    missionIntent: 'Emergency technical survey post-storm.',
    startTime: new Date(Date.now() - 3600000).toISOString(),
    endTime: new Date(Date.now() - 1800000).toISOString(),
    permittedActivities:
      'Emergency site assessment and hazard mapping under time-limited access.',
    useCategory: 'emergency_recovery',
    consentStatus: 'issued',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
}

function getMockCertificate(bookingId: string): ConsentCertificate {
  const existing = certificateMocks[bookingId]
  if (existing) return existing

  const now = new Date()
  return {
    id: `cert-${bookingId}`,
    bookingId,
    bookingVtId: `vt-bkg-${bookingId}`,
    certificateType: 'consent_certificate',
    issueDate: now.toISOString(),
    platformName: 'VertiAccess',
    digitalSignature: `SIG_mock_${bookingId.padStart(6, '0')}`,
    siteStatusAtIssue: 'active',
    authorityDeclaration:
      'Mock certificate generated for frontend preview. Live data integration will replace this payload.',
    landownerName: 'Mock Landowner Authority',
    landownerEmail: 'landowner@mock.example',
    landownerPhone: '+44 0000 000000',
    siteName: 'Mock Site',
    siteType: 'Test Site',
    siteAddress: 'Mock Address, UK',
    siteGeometrySize: 100,
    operatorName: 'Mock Operator',
    operatorOrganisation: 'Mock Org',
    operatorEmail: 'operator@mock.example',
    operationReference: `OPS-MOCK-${bookingId}`,
    flyerId: 'GBR-RP-MOCK',
    droneModel: 'Mock Drone',
    missionIntent: 'Mock mission for UI integration.',
    startTime: now.toISOString(),
    endTime: new Date(now.getTime() + 3600000).toISOString(),
    permittedActivities: 'Mock permitted activity.',
    useCategory: 'planned_toal',
    consentStatus: 'issued',
    createdAt: now.toISOString(),
  }
}

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

export default function CertificatePage() {
  const router = useRouter()
  const params = useParams<{ bookingId: string }>()
  const bookingId = params?.bookingId ?? ''

  const certificate = React.useMemo(
    () => getMockCertificate(bookingId),
    [bookingId],
  )
  const [now, setNow] = React.useState(() => new Date())

  React.useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 30000)
    return () => window.clearInterval(interval)
  }, [])

  const isExpired = now > new Date(certificate.endTime)

  const displayStatus = React.useMemo(() => {
    if (isExpired) return 'EXPIRED'
    if (certificate.consentStatus === 'issued') return 'VALID'
    if (certificate.consentStatus === 'revoked') return 'REVOKED'
    return 'PENDING'
  }, [certificate.consentStatus, isExpired])

  const displayStatusClasses = React.useMemo(() => {
    if (isExpired) return 'bg-red-100 text-red-800 border-red-500'
    if (certificate.consentStatus === 'issued')
      return 'bg-emerald-100 text-emerald-800 border-emerald-500'
    if (certificate.consentStatus === 'revoked')
      return 'bg-red-100 text-red-800 border-red-500'
    return 'bg-amber-100 text-amber-800 border-amber-500'
  }, [certificate.consentStatus, isExpired])

  const verificationUrl = React.useMemo(
    () =>
      `https://vertiaccess.app/verify/${encodeURIComponent(certificate.digitalSignature)}`,
    [certificate.digitalSignature],
  )

  const handleDownloadPdf = React.useCallback(() => {
    window.print()
  }, [])

  return (
    <>
      <style>{`
                @media print {
                    body {
                        background: #ffffff !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                        margin: 0;
                        padding: 0;
                    }

                    .no-print {
                        display: none !important;
                    }

                    @page {
                        size: A4;
                        margin: 5mm;
                    }

                    .certificate-shell {
                        border: 1px solid #e5e7eb !important;
                        border-radius: 0 !important;
                        box-shadow: none !important;
                        margin: 0 !important;
                        width: 100% !important;
                        height: auto !important;
                        font-size: 12px !important;
                    }

                    section {
                        page-break-inside: avoid;
                    }

                    /* Ensure all text is high contrast for print */
                    .text-muted-foreground {
                        color: #6b7280 !important;
                    }
                }
            `}</style>

      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 pb-24 md:pb-10">
        <div className="mx-auto w-full max-w-6xl p-4 md:p-8">
          <div className="no-print mb-8 space-y-4 flex justify-between">
            <div className="flex flex-col gap-6 md:gap-8">
              <div className="space-y-2">
                <h1 className="text-3xl font-black uppercase tracking-tighter text-foreground">
                  Consent Certificate
                </h1>
                <p className="text-sm font-semibold text-muted-foreground">
                  Booking{' '}
                  <span className="font-black text-foreground">
                    #{certificate.bookingId}
                  </span>{' '}
                  | Reference{' '}
                  <span className="font-black text-foreground">
                    {certificate.bookingVtId}
                  </span>
                </p>
              </div>
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
            <CardHeader className="border-b border-border/40 bg-gradient-to-br from-muted/50 to-muted/30 p-6 md:p-8 print:p-6 print:bg-muted/5 print:border-b">
              <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between print:grid print:grid-cols-[1fr_auto] print:gap-8 print:items-start">
                <div className="min-w-0 flex-1 space-y-6 print:space-y-3">
                  {/* Badges Row */}
                  <div className="flex flex-wrap items-center gap-3 print:gap-2">
                    {/* Platform Badge */}
                    <div className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1.5">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded border border-primary/40 bg-primary/15 text-[8px] font-black text-primary">
                        VA
                      </span>
                      <span className="text-[8px] font-black uppercase tracking-[0.22em] text-primary">
                        {certificate.platformName}
                      </span>
                    </div>

                    {/* Certificate Type Badge */}
                    <div className="inline-flex items-center gap-2 rounded-lg border border-border/40 bg-background px-2.5 py-1.5 shadow-sm">
                      <FileBadge2 className="h-3.5 w-3.5 text-primary" />
                      <span className="text-[8px] font-black uppercase tracking-[0.22em] text-foreground">
                        {certificate.certificateType.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Title & Issue Date */}
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
                      <div className="hidden h-8 w-px bg-border/40 sm:block print:hidden"></div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground/60 print:text-[8px]">
                          Certificate ID
                        </p>
                        <p className="text-sm font-black text-foreground print:text-xs">
                          {certificate.id}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Section: Status & QR */}
                <div className="flex flex-col items-center gap-6 md:items-end md:pt-0 print:gap-3 print:items-end print:pt-0">
                  {/* Status Badge */}
                  <Badge
                    className={`h-10 border-2 px-6 text-[10px] font-black uppercase tracking-wider shadow-md print:h-7 print:px-3 print:text-[8px] print:shadow-none ${displayStatusClasses}`}
                  >
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    {displayStatus}
                  </Badge>

                  {/* QR Code Container */}
                  <a
                    href={verificationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex flex-col items-center gap-3 rounded-xl border border-border/40 bg-background p-4 transition-all duration-300 hover:border-primary/50 hover:bg-muted/70 hover:shadow-xl print:p-2 print:border-border/20 print:gap-1"
                    title="Scan to verify certificate authenticity"
                  >
                    <div className="rounded-lg border border-border/30 bg-background p-2 transition-all group-hover:border-primary/50 group-hover:scale-105 print:p-1">
                      <QRCode value={verificationUrl} size={72} />
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <p className="text-[8px] font-black uppercase tracking-[0.24em] text-muted-foreground transition-colors group-hover:text-primary">
                        Scan to Verify
                      </p>
                      <p className="text-[7px] font-bold text-muted-foreground/50">
                        Secure Verification Key
                      </p>
                    </div>
                  </a>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 p-5 md:p-8 print:grid print:grid-cols-2 print:gap-x-8 print:space-y-0 print:p-6 print:items-start">
              {/* Column 1: Core Authority & Site Details */}
              <div className="space-y-6 print:space-y-4">
                <section className="space-y-3 print:space-y-1">
                  <h2 className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground print:text-[10px]">
                    Authority Declaration
                  </h2>
                  <p className="text-sm leading-relaxed print:text-[11px] print:leading-normal">
                    {certificate.authorityDeclaration}
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
                    value={certificate.permittedActivities}
                  />
                </section>

                <section className="space-y-3 border-t border-border/40 pt-4 print:space-y-1 print:pt-3">
                  <h2 className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground print:text-[10px]">
                    Block A: Site Details
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
                      label="TOAL Radius"
                      value={`${certificate.siteGeometrySize}m`}
                    />
                  </div>
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
              </div>

              {/* Column 2: Operator, Mission & Signatures */}
              <div className="space-y-6 print:space-y-4 print:border-l print:border-border/40 print:pl-8">
                <section className="space-y-3 border-t border-border/40 pt-4 md:border-t-0 md:pt-0 print:space-y-1">
                  <h2 className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground print:text-[10px]">
                    Block B: Operator And Mission
                  </h2>
                  <div className="grid gap-3 md:grid-cols-2 print:gap-x-4 print:gap-y-2">
                    <DetailItem
                      label="Operator"
                      value={certificate.operatorName}
                    />
                    <DetailItem label="Flyer ID" value={certificate.flyerId} />
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
                      value={certificate.operatorOrganisation}
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
                    label="Digital Signature"
                    value={certificate.digitalSignature}
                  />
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
                  <DetailItem
                    label="Verification URL"
                    value={verificationUrl}
                  />
                </section>

                <div className="print:pt-4">
                  <p className="text-[11px] text-muted-foreground print:text-[9px]">
                    Generated:{' '}
                    {format(
                      new Date(certificate.createdAt),
                      'dd MMM yyyy, HH:mm',
                    )}{' '}
                    | Certificate ID: {certificate.id}
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
