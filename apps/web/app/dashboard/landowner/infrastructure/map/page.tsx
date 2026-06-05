'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus,
  MapPin,
  Building2,
  Clock,
  Wallet,
  Loader2,
  List as ListIcon,
} from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card'
import { DetailedSite } from '../schema'
import { useAuthStore } from '@/store/use-auth-store'
import { Alert, AlertDescription, AlertTitle } from '@workspace/ui/components/alert'
import { UserCheck } from 'lucide-react'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { LandownerMapContainer } from '../components/landowner-map-container'

import { siteService } from '@/services/site.service'
import { paymentService } from '@/services/payments/payment.service'
import { toast } from 'sonner'

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
  if (s.status === 'ACTIVE') {
    mappedStatus = 'active'
  } else if (s.status === 'DISABLE') {
    mappedStatus = 'disabled'
  } else if (s.status === 'TEMPORARY_RESTRICTED') {
    mappedStatus = 'temporary_unavailable'
  } else if (s.status === 'REJECTED' || s.status === 'WITHDRAWN') {
    mappedStatus = 'rejected'
  }

  return {
    id: s.id,
    vaId: s.vaId || undefined,
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
  } as any
}

export default function InfrastructureAssetsMapPage() {
  const user = useAuthStore((state) => state.user)
  const isVerified = user?.verified || false
  const [sites, setSites] = React.useState<DetailedSite[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    let mounted = true

    async function loadData() {
      try {
        setIsLoading(true)
        const sitesRes = await siteService.listSites().catch(() => ({ success: false, data: [] }))

        if (!mounted) return

        if (sitesRes.success && Array.isArray(sitesRes.data)) {
          setSites(sitesRes.data.map(mapBackendSiteToDetailedSite))
        } else {
          setSites([])
        }
      } catch (err: any) {
        toast.error('Failed to load map data', {
          description: err.message || 'An error occurred while fetching your assets.',
        })
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    loadData()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 w-full h-[calc(100vh-84px)] overflow-hidden">
      {!isVerified && (
        <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-200 shrink-0">
          <UserCheck className="h-5 w-5 text-amber-600" />
          <div className="flex w-full items-center justify-between gap-4">
            <div className="space-y-1">
              <AlertTitle className="text-sm font-black uppercase tracking-widest">
                Identity Verification Pending
              </AlertTitle>
            </div>
            <Button size="sm" variant="outline" asChild>
              <Link href="/dashboard/profile">Verify ID</Link>
            </Button>
          </div>
        </Alert>
      )}

      {/* Main layout with title, description, register button, and raw table directly on the page */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border/40 shrink-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">
              Infrastructure Map
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Geospatial visualization of your registered takeoff and landing assets.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 shrink-0">
          {/* View Toggler / Switch back to list */}
          <Button
            asChild
            variant="outline"
            className="flex items-center gap-2 h-[40px] font-semibold"
          >
            <Link href="/dashboard/landowner/infrastructure">
              <ListIcon className="w-4 h-4" />
              List View
            </Link>
          </Button>

          {!isVerified ? (
            <div className="flex flex-col items-end gap-1">
              <Button
                disabled
                className="font-bold shadow-md opacity-50 cursor-not-allowed w-full sm:w-auto h-[40px]"
              >
                <Plus className="mr-2 h-4 w-4" strokeWidth={3} />
                Register new assets
              </Button>
            </div>
          ) : (
            <Button
              asChild
              className="font-bold shadow-md shadow-primary/20 hover:shadow-lg transition-all w-full sm:w-auto h-[40px]"
            >
              <Link href="/dashboard/landowner/infrastructure/add">
                <Plus className="mr-2 h-4 w-4" strokeWidth={3} />
                Register new assets
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 relative rounded-2xl overflow-hidden border border-border/60 bg-muted/5">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-sm font-semibold text-muted-foreground">Loading Assets Map...</span>
          </div>
        ) : (
          <LandownerMapContainer sites={sites} />
        )}
      </div>
    </div>
  )
}
