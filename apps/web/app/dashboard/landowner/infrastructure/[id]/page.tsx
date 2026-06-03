'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  Banknote,
  Calendar,
  FileText,
  Activity,
  Shield,
  Download,
  Edit,
  Clock,
} from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import { Badge } from '@workspace/ui/components/badge'
import { Separator } from '@workspace/ui/components/separator'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { cn } from '@workspace/ui/lib/utils'
import { toast } from 'sonner'
import { siteService } from '@/services/site.service'
import type { DetailedSite, SiteStats } from '../schema'
import {
  generateGeoJSONFeature,
  downloadGeoJSONFile,
} from '@/lib/geojson-utils'

// Lazy-load the map to avoid SSR issues with Leaflet
const InfrastructureDetailMap = dynamic(
  () =>
    import('../components/infrastructure-detail-map').then(
      (mod) => mod.InfrastructureDetailMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-muted/30 animate-pulse rounded-xl" />
    ),
  },
)

// ─── Helpers ────────────────────────────────────────────────────────────────

function getStatusMeta(status: DetailedSite['status']) {
  if (status === 'active')
    return {
      label: 'ACTIVE',
      className: 'bg-emerald-100 text-emerald-700',
    }
  if (status === 'pending')
    return {
      label: 'PENDING REVIEW',
      className: 'bg-amber-100 text-amber-700',
    }
  if (status === 'disabled')
    return { label: 'DISABLED', className: 'bg-slate-100 text-slate-700' }
  if (status === 'temporary_unavailable')
    return {
      label: 'TEMPORARILY UNAVAILABLE',
      className: 'bg-orange-100 text-orange-700',
    }
  return { label: 'REJECTED', className: 'bg-red-100 text-red-700' }
}

function getAssetTypeLabel(category: string) {
  const mapping: Record<string, string> = {
    private_land: 'Private Land',
    helipad: 'Helipad',
    vertiport: 'Vertiport',
    droneport: 'Drone Port',
    temporary_landing_site: 'Temporary Landing Site',
  }
  return mapping[category] || category
}

function mapBackendSiteToDetailedSite(s: any): DetailedSite {
  const geometry = s.geometry || {}
  const clzGeometry = s.clzGeometry || {}

  const toalPolygonPoints =
    geometry.type === 'polygon' && geometry.points
      ? geometry.points.map((p: any) => [p.lat, p.lng] as [number, number])
      : []

  const emergencyPolygonPoints =
    clzGeometry.type === 'polygon' && clzGeometry.points
      ? clzGeometry.points.map((p: any) => [p.lat, p.lng] as [number, number])
      : []

  let activationStartDate = ''
  let activationStartTime = '09:00'
  if (s.validityStart) {
    const validityStart = new Date(s.validityStart)
    const datePart = validityStart.toISOString().split('T')[0]
    if (datePart) activationStartDate = datePart
    const timePart = validityStart.toTimeString().split(' ')[0]
    if (timePart) activationStartTime = timePart.slice(0, 5)
  }

  let activationEndDate = ''
  let activationEndTime = '17:00'
  if (s.validityEnd) {
    const validityEnd = new Date(s.validityEnd)
    const datePart = validityEnd.toISOString().split('T')[0]
    if (datePart) activationEndDate = datePart
    const timePart = validityEnd.toTimeString().split(' ')[0]
    if (timePart) activationEndTime = timePart.slice(0, 5)
  }

  const photoUrls = (s.documents || [])
    .filter((doc: any) => doc.documentType === 'photo')
    .map((doc: any) => ({
      fileKey: doc.fileKey,
      fileName: doc.fileName || 'photo.png',
      fileSize: Number(doc.fileSize) || 0,
      category: 'SITE_PHOTO',
      url: doc.downloadUrl || doc.fileKey,
    }))

  const policyDocuments = (s.documents || [])
    .filter((doc: any) => doc.documentType === 'policy')
    .map((doc: any) => ({
      fileKey: doc.fileKey,
      fileName: doc.fileName || 'policy.pdf',
      fileSize: Number(doc.fileSize) || 0,
      category: 'SITE_POLICY',
      url: doc.downloadUrl || doc.fileKey,
    }))

  const ownershipDocuments = (s.documents || [])
    .filter((doc: any) => doc.documentType === 'ownership')
    .map((doc: any) => ({
      fileKey: doc.fileKey,
      fileName: doc.fileName || 'ownership.pdf',
      fileSize: Number(doc.fileSize) || 0,
      category: 'SITE_OWNERSHIP',
      url: doc.downloadUrl || doc.fileKey,
    }))

  let mappedStatus: DetailedSite['status'] = 'pending'
  if (s.status === 'ACTIVE') mappedStatus = 'active'
  else if (s.status === 'DISABLE') mappedStatus = 'disabled'
  else if (s.status === 'TEMPORARY_RESTRICTED')
    mappedStatus = 'temporary_unavailable'
  else if (s.status === 'REJECTED' || s.status === 'WITHDRAWN')
    mappedStatus = 'rejected'

  return {
    id: s.id,
    name: s.name,
    category: s.siteCategory || 'Urban Operations',
    siteType: s.siteType || 'toal',
    address: s.address,
    postcode: s.postcode,
    latitude: geometry.center?.lat ?? 51.505,
    longitude: geometry.center?.lng ?? -0.09,
    toalRadius: geometry.radius || 100,
    toalGeometryMode: geometry.type || 'circle',
    toalPolygonPoints,
    allowEmergencyLanding: !!s.emergencyRecoveryEnabled,
    emergencyRadius: clzGeometry.radius || 350,
    emergencyGeometryMode: clzGeometry.type || 'circle',
    emergencyPolygonPoints,
    contactEmail: s.contactEmail,
    contactPhone: s.contactPhone,
    description: s.description || '',
    photoUrls,
    isPermanentActivation: !s.validityEnd,
    activationStartDate,
    activationStartTime,
    activationEndDate,
    activationEndTime,
    bookingApprovalModel: s.autoApprove ? 'auto' : 'manual',
    policyDocuments,
    ownershipDocuments,
    toalFee: Number(s.toalAccessFee) || 0,
    emergencyFee: Number(s.clzAccessFee) || 0,
    status: mappedStatus,
    createdAt: s.createdAt
      ? new Date(s.createdAt).toISOString().split('T')[0] || ''
      : '',
    reason: s.rejectionReasonNote || s.adminNote || undefined,
    utilisation: s.utilisation ?? 0,
    lastUsed: s.lastUsed ?? null,
    vaId: s.vaId || null,
  } as any
}

// ─── Reusable section components ────────────────────────────────────────────

function InfoSection({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-primary">
        <Icon className="h-4 w-4" />
        <h4 className="font-bold text-sm tracking-tight">{title}</h4>
      </div>
      <div className="space-y-2.5 pl-6">{children}</div>
    </div>
  )
}

function InfoItem({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
        {label}
      </span>
      <div className="text-sm font-medium text-foreground">{value}</div>
    </div>
  )
}

function SectionSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-32" />
      <div className="space-y-2.5 pl-6">
        <div className="space-y-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function InfrastructureDetailPage() {
  const params = useParams()
  const router = useRouter()
  const siteId = params.id as string

  const [site, setSite] = React.useState<DetailedSite | null>(null)
  const [allSites, setAllSites] = React.useState<DetailedSite[]>([])
  const [stats, setStats] = React.useState<SiteStats | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isStatsLoading, setIsStatsLoading] = React.useState(true)

  // Load site details + all sites for the map
  React.useEffect(() => {
    let mounted = true

    async function loadData() {
      try {
        setIsLoading(true)
        setIsStatsLoading(true)

        const [siteRes, allSitesRes] = await Promise.all([
          siteService.getSite(siteId),
          siteService.listSites(),
        ])

        if (!mounted) return

        if (siteRes.success && siteRes.data) {
          setSite(mapBackendSiteToDetailedSite(siteRes.data))
        }

        if (allSitesRes.success && Array.isArray(allSitesRes.data)) {
          setAllSites(allSitesRes.data.map(mapBackendSiteToDetailedSite))
        }
      } catch (err: any) {
        toast.error('Failed to load site details', {
          description: err.message || 'An error occurred.',
        })
      } finally {
        if (mounted) setIsLoading(false)
      }

      // Stats loaded separately to not block the main UI
      try {
        const statsRes = await siteService.getSiteStats(siteId)
        if (mounted && statsRes.success) {
          setStats(statsRes.data)
        }
      } catch {
        // Stats are non-critical — silently fail
      } finally {
        if (mounted) setIsStatsLoading(false)
      }
    }

    loadData()
    return () => {
      mounted = false
    }
  }, [siteId])

  const handleSiteSelect = React.useCallback(
    (selectedId: string) => {
      if (selectedId !== siteId) {
        router.push(`/dashboard/landowner/infrastructure/${selectedId}`)
      }
    },
    [siteId, router],
  )

  const handleDownloadGeoJSON = (type: 'toal' | 'emergency') => {
    if (!site) return
    const mode =
      type === 'toal' ? site.toalGeometryMode : site.emergencyGeometryMode
    const radius = type === 'toal' ? site.toalRadius : site.emergencyRadius
    const points =
      type === 'toal' ? site.toalPolygonPoints : site.emergencyPolygonPoints
    const name =
      type === 'toal'
        ? `${site.name} - TOAL Zone`
        : `${site.name} - Emergency Zone`
    const center = { lat: site.latitude, lng: site.longitude }

    const geojson = generateGeoJSONFeature(
      mode as 'circle' | 'polygon',
      center,
      radius || 0,
      points,
      name,
    )
    if (geojson) {
      downloadGeoJSONFile(
        `${site.name.toLowerCase().replace(/\s+/g, '_')}_${type}_boundary.geojson`,
        geojson,
      )
    }
  }

  const statusMeta = site ? getStatusMeta(site.status) : null

  const calculatedToalArea = site?.toalRadius
    ? `${Math.round(Math.PI * Math.pow(site.toalRadius, 2)).toLocaleString()} m²`
    : 'N/A'

  const calculatedEmergencyArea =
    site?.emergencyRadius && site?.allowEmergencyLanding
      ? `${Math.round(Math.PI * Math.pow(site.emergencyRadius, 2)).toLocaleString()} m²`
      : 'N/A'

  return (
    <div className="flex flex-col h-[calc(100vh-60px)]">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-4 px-4 md:px-6 py-3 border-b border-border/40 bg-background/95 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={() => router.push('/dashboard/landowner/infrastructure')}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-xs font-bold">Back</span>
          </Button>
          {!isLoading && site && (
            <div className="flex items-center gap-2">
              <Separator orientation="vertical" className="h-5" />
              <span className="text-xs font-mono font-bold text-muted-foreground">
                {(site as any).vaId || site.id.slice(0, 8).toUpperCase()}
              </span>
              <Separator orientation="vertical" className="h-5" />
              <h1 className="text-sm font-bold tracking-tight truncate max-w-[200px]">
                {site.name}
              </h1>
              {statusMeta && (
                <Badge
                  className={cn(
                    'text-[9px] uppercase tracking-widest border-none font-bold h-5 px-2',
                    statusMeta.className,
                  )}
                >
                  {statusMeta.label}
                </Badge>
              )}
            </div>
          )}
        </div>

        {!isLoading && site && (
          <Button
            size="sm"
            className="gap-1.5 font-bold shadow-sm h-8 text-xs"
            onClick={() =>
              router.push(
                `/dashboard/landowner/infrastructure/edit/${site.id}`,
              )
            }
          >
            <Edit className="h-3.5 w-3.5" />
            Edit Asset
          </Button>
        )}
      </div>

      {/* Main Content — 40/60 split */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel — Info (40%) */}
        <div className="w-full lg:w-[40%] overflow-y-auto border-r border-border/40 custom-scrollbar">
          <div className="p-4 md:p-6 space-y-6">
            {isLoading ? (
              /* ── Loading Skeleton ── */
              <div className="space-y-6">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <Separator />
                <SectionSkeleton />
                <Separator />
                <SectionSkeleton />
                <Separator />
                <SectionSkeleton />
                <Separator />
                <SectionSkeleton />
                <Separator />
                <SectionSkeleton />
              </div>
            ) : site ? (
              <>
                {/* ── Asset Summary ── */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono font-bold text-muted-foreground">
                          {(site as any).vaId ||
                            site.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          —
                        </span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          Asset Summary
                        </span>
                      </div>
                      <h2 className="text-lg font-bold tracking-tight">
                        {site.name}
                      </h2>
                      <div className="flex items-center gap-2 flex-wrap">
                        {statusMeta && (
                          <Badge
                            className={cn(
                              'text-[9px] uppercase tracking-widest border-none font-bold h-5 px-2',
                              statusMeta.className,
                            )}
                          >
                            {statusMeta.label}
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className="text-[10px] font-bold px-2 h-5 border-none bg-muted/60 capitalize"
                        >
                          {getAssetTypeLabel(site.category)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="pl-[52px] space-y-2">
                    <InfoItem
                      label="Created"
                      value={
                        site.createdAt
                          ? new Date(site.createdAt).toLocaleDateString(
                              'en-GB',
                              {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                              },
                            )
                          : 'N/A'
                      }
                    />
                    <InfoItem
                      label="Asset Type"
                      value={getAssetTypeLabel(site.category)}
                    />
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                        Capabilities
                      </span>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          TOAL
                        </div>
                        {site.allowEmergencyLanding && (
                          <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            Emergency Recovery
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* ── Asset Geometry ── */}
                <InfoSection title="Asset Geometry" icon={MapPin}>
                  <InfoItem label="TOAL Area" value={calculatedToalArea} />
                  {site.allowEmergencyLanding && (
                    <InfoItem
                      label="Emergency Area"
                      value={calculatedEmergencyArea}
                    />
                  )}
                  <InfoItem
                    label="Geometry"
                    value={
                      site.toalGeometryMode === 'polygon'
                        ? 'Polygon'
                        : 'Circle'
                    }
                  />
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                      Boundary Files
                    </span>
                    <div className="flex flex-col gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10px] font-semibold gap-2 border-primary/20 hover:border-primary/50 w-fit"
                        onClick={() => handleDownloadGeoJSON('toal')}
                      >
                        <Download className="h-3 w-3" />
                        Download TOAL GeoJSON
                      </Button>
                      {site.allowEmergencyLanding && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[10px] font-semibold gap-2 border-primary/20 hover:border-primary/50 w-fit"
                          onClick={() => handleDownloadGeoJSON('emergency')}
                        >
                          <Download className="h-3 w-3" />
                          Download CLZ GeoJSON
                        </Button>
                      )}
                    </div>
                  </div>
                </InfoSection>

                <Separator />

                {/* ── Operational Performance ── */}
                <InfoSection title="Operational Performance" icon={Activity}>
                  {isStatsLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-36" />
                    </div>
                  ) : stats ? (
                    <>
                      <InfoItem
                        label="Operations This Month"
                        value={
                          <span className="font-mono font-bold">
                            {stats.operationsThisMonth}
                          </span>
                        }
                      />
                      <InfoItem
                        label="Approved Requests"
                        value={
                          <span className="font-mono font-bold text-emerald-600">
                            {stats.approvedRequests}
                          </span>
                        }
                      />
                      <InfoItem
                        label="Pending Requests"
                        value={
                          <span className="font-mono font-bold text-amber-600">
                            {stats.pendingRequests}
                          </span>
                        }
                      />
                      <InfoItem
                        label="Rejected Requests"
                        value={
                          <span className="font-mono font-bold text-red-600">
                            {stats.rejectedRequests}
                          </span>
                        }
                      />
                      <InfoItem
                        label="TOAL Operations"
                        value={
                          <span className="font-mono font-bold">
                            {stats.totalToalOperations}
                          </span>
                        }
                      />
                      {site.allowEmergencyLanding && (
                        <InfoItem
                          label="Emergency Recoveries"
                          value={
                            <span className="font-mono font-bold">
                              {stats.emergencyRecoveries}
                            </span>
                          }
                        />
                      )}
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">
                      Unable to load stats.
                    </span>
                  )}
                </InfoSection>

                <Separator />

                {/* ── Availability & Policy ── */}
                <InfoSection title="Availability & Policy" icon={Calendar}>
                  <InfoItem
                    label="Availability"
                    value={
                      site.isPermanentActivation ? (
                        <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-100 border-none px-2 h-5 text-[10px] uppercase">
                          Permanent
                        </Badge>
                      ) : (
                        `${site.activationStartDate} to ${site.activationEndDate}`
                      )
                    }
                  />
                  <InfoItem
                    label="Booking Model"
                    value={
                      site.bookingApprovalModel === 'auto' ? (
                        <Badge className="bg-emerald-50 text-emerald-700 border-none px-2 h-5 text-[10px]">
                          Auto-Approval
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-50 text-amber-700 border-none px-2 h-5 text-[10px]">
                          Manual Approval
                        </Badge>
                      )
                    }
                  />
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                      Policy Documents
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {site.policyDocuments.length > 0 ? (
                        site.policyDocuments.map((doc: any, i: number) => (
                          <Button
                            key={i}
                            variant="outline"
                            size="sm"
                            className="h-7 text-[10px] font-semibold gap-2 border-primary/20 hover:border-primary/50"
                            onClick={() => window.open(doc.url, '_blank')}
                          >
                            <FileText className="h-3 w-3" />
                            Policy #{i + 1}
                          </Button>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          No policy documents.
                        </span>
                      )}
                    </div>
                  </div>
                </InfoSection>

                <Separator />

                {/* ── Commercials ── */}
                <InfoSection title="Commercials" icon={Banknote}>
                  <InfoItem
                    label="TOAL Access Fee"
                    value={
                      <span className="font-mono text-primary font-bold">
                        £{site.toalFee.toFixed(2)}
                      </span>
                    }
                  />
                  {site.allowEmergencyLanding && (
                    <InfoItem
                      label="Emergency & Recovery Site Fee"
                      value={
                        <span className="font-mono font-bold">
                          £{site.emergencyFee.toFixed(2)}
                        </span>
                      }
                    />
                  )}
                  {isStatsLoading ? (
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ) : stats ? (
                    <InfoItem
                      label="Revenue Generated (This Month)"
                      value={
                        <span className="font-mono text-emerald-600 font-bold">
                          £{stats.revenueThisMonth.toFixed(2)}
                        </span>
                      }
                    />
                  ) : null}
                </InfoSection>

                <Separator />

                {/* ── Administration ── */}
                <InfoSection title="Administration" icon={Shield}>
                  <InfoItem
                    label="Point of Contact"
                    value={
                      <span className="font-semibold">{site.name}</span>
                    }
                  />
                  <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    {site.contactEmail}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    {site.contactPhone}
                  </div>
                </InfoSection>

                {/* Bottom padding for scroll */}
                <div className="h-6" />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Building2 className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-sm font-bold text-muted-foreground">
                  Site not found
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() =>
                    router.push('/dashboard/landowner/infrastructure')
                  }
                >
                  Back to Assets
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel — Map (60%) */}
        <div className="hidden lg:block lg:w-[60%] relative bg-muted/20">
          {allSites.length > 0 ? (
            <InfrastructureDetailMap
              sites={allSites}
              activeSiteId={siteId}
              onSiteSelect={handleSiteSelect}
              className="h-full"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-2">
                <MapPin className="h-8 w-8 text-muted-foreground/30 mx-auto" />
                <Skeleton className="h-4 w-32 mx-auto" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
