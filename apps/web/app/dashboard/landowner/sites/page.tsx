'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Eye, MapPin, Building2, CheckCircle2, Clock, Wallet, MoreHorizontal, Settings2 } from 'lucide-react'
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
import { SiteStatusModal } from './components/site-status-modal'
import { DetailedSite } from './schema'
import { useAuthStore } from '@/store/use-auth-store'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@workspace/ui/components/alert'
import { UserCheck } from 'lucide-react'
import { Skeleton } from '@workspace/ui/components/skeleton'

import { siteService } from '@/services/site.service'
import { paymentService } from '@/services/payments/payment.service'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu'

// Columns definition moved inside the component to access state handlers

function getStatusMeta(status: DetailedSite['status']) {
  if (status === 'active') {
    return {
      label: 'ACTIVE',
      className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
    }
  }

  if (status === 'pending') {
    return {
      label: 'PENDING REVIEW',
      className: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
    }
  }

  if (status === 'disabled') {
    return {
      label: 'DISABLED',
      className: 'bg-slate-100 text-slate-700 hover:bg-slate-100',
    }
  }

  if (status === 'temporary_unavailable') {
    return {
      label: 'TEMPORARILY UNAVAILABLE',
      className: 'bg-orange-100 text-orange-700 hover:bg-orange-100',
    }
  }

  return {
    label: 'REJECTED',
    className: 'bg-red-100 text-red-700 hover:bg-red-100',
  }
}

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

  let mappedStatus: DetailedSite['status'] = 'pending';
  if (s.status === 'ACTIVE') {
    mappedStatus = 'active';
  } else if (s.status === 'DISABLE') {
    mappedStatus = 'disabled';
  } else if (s.status === 'TEMPORARY_RESTRICTED') {
    mappedStatus = 'temporary_unavailable';
  } else if (s.status === 'REJECTED' || s.status === 'WITHDRAWN') {
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
  const [totalEarnings, setTotalEarnings] = React.useState<number>(0)
  const [isEarningsLoading, setIsEarningsLoading] = React.useState(true)
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [selectedSite, setSelectedSite] = React.useState<DetailedSite | null>(
    null,
  )
  const [statusModalSite, setStatusModalSite] = React.useState<DetailedSite | null>(null)

  React.useEffect(() => {
    let mounted = true

    async function loadData() {
      try {
        setIsLoading(true)
        setIsEarningsLoading(true)
        const [sitesRes, balanceRes] = await Promise.all([
          siteService.listSites().catch(() => ({ success: false, data: [] })),
          paymentService.getLandownerBalance().catch(() => ({ totalEarned: 0 }))
        ])

        if (!mounted) return

        if (sitesRes.success && Array.isArray(sitesRes.data)) {
          setSites(sitesRes.data.map(mapBackendSiteToDetailedSite))
        } else {
          setSites([])
        }

        setTotalEarnings(balanceRes.totalEarned || 0)
      } catch (err: any) {
        toast.error('Failed to load dashboard data', {
          description: err.message || 'An error occurred while fetching your data.'
        })
      } finally {
        if (mounted) {
          setIsLoading(false)
          setIsEarningsLoading(false)
        }
      }
    }

    loadData()

    return () => {
      mounted = false
    }
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
              <span className="truncate max-w-3xl">
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
          const statusMeta = getStatusMeta(row.original.status)
          return (
            <Badge
              className={cn(
                'text-[9px] uppercase tracking-widest border-none font-bold h-5 px-2',
                statusMeta.className,
              )}
            >
              {statusMeta.label}
            </Badge>
          )
        },
      },
      {
        id: 'actions',
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/5"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Site Actions
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer gap-2"
                  onClick={() => setSelectedSite(row.original)}
                >
                  <Eye className="h-4 w-4" />
                  Preview site
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer gap-2"
                  disabled={row.original.status === 'pending' || row.original.status === 'rejected'}
                  onClick={() => setStatusModalSite(row.original)}
                >
                  <Settings2 className="h-4 w-4" />
                  {row.original.status === 'pending' || row.original.status === 'rejected'
                    ? 'Status changes after approval'
                    : 'Change status'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [],
  )

  const handleStatusConfirm = React.useCallback(async (status: 'ACTIVE' | 'DISABLE' | 'TEMPORARY_RESTRICTED', note?: string) => {
    if (!statusModalSite) {
      return
    }

    try {
      const response = await siteService.updateSiteStatus(statusModalSite.id, {
        status,
        adminNote: note,
      })

      if (!response.success) {
        throw new Error(response.message || 'Unable to update site status')
      }

      setSites((currentSites) =>
        currentSites.map((site) =>
          site.id === statusModalSite.id
            ? {
                ...site,
                status:
                  status === 'ACTIVE'
                    ? 'active'
                    : status === 'DISABLE'
                      ? 'disabled'
                      : 'temporary_unavailable',
              }
            : site,
        ),
      )

      setSelectedSite((currentSite) =>
        currentSite?.id === statusModalSite.id
          ? {
              ...currentSite,
              status:
                status === 'ACTIVE'
                  ? 'active'
                  : status === 'DISABLE'
                    ? 'disabled'
                    : 'temporary_unavailable',
            }
          : currentSite,
      )

      toast.success('Site status updated', {
        description: response.message || `The site is now ${status.toLowerCase().replace(/_/g, ' ')}.`,
      })
      setStatusModalSite(null)
    } catch (err: any) {
      toast.error('Failed to update site status', {
        description: err?.message || 'The status change could not be saved.',
      })
    }
  }, [statusModalSite])

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto">
      {!isVerified && (
        <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-200 mb-2">
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

      {/* Header with quick stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Total Registered Sites */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
              Total Registered Sites
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tight text-foreground">
              {isLoading ? (
                <Skeleton className="h-9 w-12" />
              ) : (
                String(sites.length).padStart(2, '0')
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pending Approval */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
              Pending Approval
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tight text-foreground">
              {isLoading ? (
                <Skeleton className="h-9 w-12" />
              ) : (
                String(sites.filter((s) => s.status === 'pending').length).padStart(2, '0')
              )}
            </div>
          </CardContent>
        </Card>

        {/* Total Earnings */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
              Total Earnings
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tight text-foreground">
              {isEarningsLoading ? (
                <Skeleton className="h-9 w-24" />
              ) : (
                `£${Number(totalEarnings || 0).toFixed(2)}`
              )}
            </div>
          </CardContent>
        </Card>
      </div>

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

      <SiteStatusModal
        key={`${statusModalSite?.id ?? 'none'}-${statusModalSite ? 'open' : 'closed'}`}
        site={statusModalSite}
        isOpen={statusModalSite !== null}
        onClose={() => setStatusModalSite(null)}
        onConfirm={handleStatusConfirm}
      />
    </div>
  )
}
