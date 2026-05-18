'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Eye, MapPin, Building2, CheckCircle2, Clock } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'
import { Badge } from '@workspace/ui/components/badge'
import { DataTable } from '@/components/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { cn } from '@workspace/ui/lib/utils'
import { SitePreviewModal } from './components/site-preview-modal'
import { DetailedSite } from './schema'
import { useAuthStore } from '@/store/use-auth-store'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@workspace/ui/components/alert'
import { UserCheck } from 'lucide-react'

import { siteService } from '@/services/site.service'
import { toast } from 'sonner'

// Columns definition moved inside the component to access state handlers

function mapBackendSiteToDetailedSite(s: any): DetailedSite {
  const geometry = s.geometry || {};
  const clzGeometry = s.clzGeometry || {};

  const toalPolygonPoints = geometry.type === 'polygon' && geometry.points
    ? geometry.points.map((p: any) => [p.lat, p.lng] as [number, number])
    : [];

  const emergencyPolygonPoints = clzGeometry.type === 'polygon' && clzGeometry.points
    ? clzGeometry.points.map((p: any) => [p.lat, p.lng] as [number, number])
    : [];

  let activationStartDate = '';
  let activationStartTime = '09:00';
  if (s.validityStart) {
    const validityStart = new Date(s.validityStart);
    const datePart = validityStart.toISOString().split('T')[0];
    if (datePart) activationStartDate = datePart;
    const timePart = validityStart.toTimeString().split(' ')[0];
    if (timePart) activationStartTime = timePart.slice(0, 5);
  }

  let activationEndDate = '';
  let activationEndTime = '17:00';
  if (s.validityEnd) {
    const validityEnd = new Date(s.validityEnd);
    const datePart = validityEnd.toISOString().split('T')[0];
    if (datePart) activationEndDate = datePart;
    const timePart = validityEnd.toTimeString().split(' ')[0];
    if (timePart) activationEndTime = timePart.slice(0, 5);
  }

  const photoUrls = (s.documents || [])
    .filter((doc: any) => doc.documentType === 'photo')
    .map((doc: any) => ({
      fileKey: doc.fileKey,
      fileName: doc.fileName || 'photo.png',
      fileSize: Number(doc.fileSize) || 0,
      category: 'SITE_PHOTO',
      url: doc.downloadUrl || doc.fileKey,
    }));

  const policyDocuments = (s.documents || [])
    .filter((doc: any) => doc.documentType === 'policy')
    .map((doc: any) => ({
      fileKey: doc.fileKey,
      fileName: doc.fileName || 'policy.pdf',
      fileSize: Number(doc.fileSize) || 0,
      category: 'SITE_POLICY',
      url: doc.downloadUrl || doc.fileKey,
    }));

  const ownershipDocuments = (s.documents || [])
    .filter((doc: any) => doc.documentType === 'ownership')
    .map((doc: any) => ({
      fileKey: doc.fileKey,
      fileName: doc.fileName || 'ownership.pdf',
      fileSize: Number(doc.fileSize) || 0,
      category: 'SITE_OWNERSHIP',
      url: doc.downloadUrl || doc.fileKey,
    }));

  let mappedStatus: 'active' | 'pending' | 'rejected' = 'pending';
  if (s.status === 'ACTIVE') {
    mappedStatus = 'active';
  } else if (s.status === 'REJECTED' || s.status === 'DISABLE' || s.status === 'TEMPORARY_RESTRICTED' || s.status === 'WITHDRAWN') {
    mappedStatus = 'rejected';
  }

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
    createdAt: s.createdAt ? (new Date(s.createdAt).toISOString().split('T')[0] || '') : '',
    reason: s.rejectionReasonNote || s.adminNote || undefined
  };
}

export default function MySitesPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const isVerified = user?.verified || false
  const [sites, setSites] = React.useState<DetailedSite[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [selectedSite, setSelectedSite] = React.useState<DetailedSite | null>(
    null,
  )

  React.useEffect(() => {
    async function loadSites() {
      try {
        setIsLoading(true)
        const res = await siteService.listSites()
        if (res.success && Array.isArray(res.data)) {
          setSites(res.data.map(mapBackendSiteToDetailedSite))
        } else {
          setSites([])
        }
      } catch (err: any) {
        toast.error('Failed to load sites', {
          description: err.message || 'An error occurred while fetching your sites.'
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadSites()
  }, [])

  const columns = React.useMemo<ColumnDef<DetailedSite>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Site Details',
        cell: ({ row }) => (
          <div className="flex flex-col gap-1 py-1">
            <span className="font-bold text-sm text-foreground tracking-tight">
              {row.original.name}
            </span>
            <div className="flex items-center gap-1.5">
              <Badge
                variant="secondary"
                className="text-[9px] uppercase tracking-widest h-4 px-1 font-bold bg-muted/50 border-none"
              >
                {row.original.category}
              </Badge>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'address',
        header: 'Location',
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <MapPin className="h-3 w-3 shrink-0 text-primary/60" />
              <span className="truncate max-w-[220px]">
                {row.original.address}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground/70 font-mono ml-4.5">
              {row.original.postcode}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'siteType',
        header: 'Primary Function',
        cell: ({ row }) => {
          const isToal = row.original.siteType === 'toal'
          return (
            <Badge
              variant="outline"
              className={cn(
                'capitalize text-[10px] font-bold tracking-wide px-2 h-5 border-none',
                isToal
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30',
              )}
            >
              {row.original.siteType.toUpperCase()}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'toalFee',
        header: 'Base Fee',
        cell: ({ row }) => (
          <div className="flex items-baseline gap-0.5 font-mono">
            <span className="text-[10px] text-muted-foreground">£</span>
            <span className="text-sm font-bold text-foreground">
              {row.original.toalFee.toFixed(2)}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status
          return (
            <Badge
              className={cn(
                'text-[9px] uppercase tracking-widest border-none font-bold h-5 px-2',
                status === 'active'
                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                  : status === 'pending'
                    ? 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                    : 'bg-red-100 text-red-700 hover:bg-red-100',
              )}
            >
              {status}
            </Badge>
          )
        },
      },
      {
        id: 'actions',
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="text-right">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary hover:bg-primary/5 px-3"
              onClick={() => setSelectedSite(row.original)}
            >
              <Eye className="h-3.5 w-3.5" />
              Preview
            </Button>
          </div>
        ),
      },
    ],
    [],
  )

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header with quick stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-primary/5 border-primary/10 shadow-sm overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -mr-8 -mt-8 transition-transform group-hover:scale-110" />
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] uppercase tracking-widest font-bold text-primary/70">
              Total Registered Sites
            </CardDescription>
            <CardTitle className="text-3xl font-bold tracking-tight">
              {String(sites.length).padStart(2, '0')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              {sites.filter((s) => s.status === 'active').length} site{sites.filter((s) => s.status === 'active').length !== 1 ? 's are' : ' is'} currently active
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm overflow-hidden relative group">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
              Pending Approval
            </CardDescription>
            <CardTitle className="text-3xl font-bold tracking-tight text-foreground/80">
              {String(sites.filter((s) => s.status === 'pending').length).padStart(2, '0')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
              <Clock className="h-3 w-3 text-amber-500" />
              Expected review within 24 hours
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm overflow-hidden relative group">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
              Total Earnings
            </CardDescription>
            <CardTitle className="text-3xl font-bold tracking-tight text-foreground/80">
              £1,240.50
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
              <Badge className="bg-emerald-100 text-emerald-700 border-none text-[8px] h-4 px-1.5 font-bold">
                +12%
              </Badge>
              Increase from last month
            </div>
          </CardContent>
        </Card>
      </div>

      {!isVerified && (
        <Alert className="border-amber-500/50 bg-amber-500/5 text-amber-900 dark:text-amber-100 mb-2">
          <UserCheck className="h-5 w-5 text-amber-600" />
          <div className="flex w-full items-center justify-between gap-4">
            <div className="space-y-1">
              <AlertTitle className="text-sm font-black uppercase tracking-widest">
                Identity Verification Pending
              </AlertTitle>
              <AlertDescription className="text-xs font-medium opacity-90">
                Please verify your identity to upload and list sites on our
                platform.
              </AlertDescription>
            </div>
            <Button size="sm" variant="outline" asChild>
              <Link href="/dashboard/profile">Verify ID</Link>
            </Button>
          </div>
        </Alert>
      )}

      <Card className="shadow-md border-border/60">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 pb-6 border-b">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-4 w-4 text-primary" />
              <CardTitle className="text-xl font-bold tracking-tight">
                Site Management
              </CardTitle>
            </div>
            <CardDescription className="text-sm">
              Monitor and manage your takeoff and landing locations across the
              network.
            </CardDescription>
          </div>
          {!isVerified ? (
            <div className="flex flex-col items-end gap-2">
              <Button
                disabled
                className="font-bold shadow-md opacity-50 cursor-not-allowed w-full sm:w-auto"
              >
                <Plus className="mr-2 h-4 w-4" strokeWidth={3} />
                REGISTER NEW SITE
              </Button>
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-tight">
                Verify account to add sites
              </span>
            </div>
          ) : (
            <Button
              asChild
              className="font-bold shadow-md shadow-primary/20 hover:shadow-lg transition-all w-full sm:w-auto"
            >
              <Link href="/dashboard/landowner/sites/add">
                <Plus className="mr-2 h-4 w-4" strokeWidth={3} />
                REGISTER NEW SITE
              </Link>
            </Button>
          )}
        </CardHeader>
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            data={sites}
            totalRows={sites.length}
            totalPages={Math.ceil(sites.length / pagination.pageSize) || 1}
            pagination={pagination}
            onPaginationChange={setPagination}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      <SitePreviewModal
        site={selectedSite}
        isOpen={selectedSite !== null}
        onClose={() => setSelectedSite(null)}
        onEdit={(id) => router.push(`/dashboard/landowner/sites/edit/${id}`)}
      />
    </div>
  )
}
