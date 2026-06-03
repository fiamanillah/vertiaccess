'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Eye, MapPin, Building2, CheckCircle2, Clock, Wallet, MoreHorizontal, Settings2, ChevronDown } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import { Badge } from '@workspace/ui/components/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'
import { DataTable } from '@/components/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { cn } from '@workspace/ui/lib/utils'
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
    reason: s.rejectionReasonNote || s.adminNote || undefined,
    utilisation: s.utilisation ?? 0,
    lastUsed: s.lastUsed ?? null,
  } as any;
}

export default function InfrastructureAssetsPage() {
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

  const handleStatusChangeDirectly = React.useCallback(async (siteId: string, status: 'ACTIVE' | 'DISABLE' | 'TEMPORARY_RESTRICTED') => {
    try {
      const response = await siteService.updateSiteStatus(siteId, {
        status,
      })

      if (!response.success) {
        throw new Error(response.message || 'Unable to update status')
      }

      setSites((currentSites) =>
        currentSites.map((site) =>
          site.id === siteId
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

      toast.success('Operational status updated', {
        description: response.message || `The operational status has been updated.`,
      })
    } catch (err: any) {
      toast.error('Failed to update status', {
        description: err?.message || 'The status change could not be saved.',
      })
    }
  }, [])

  const columns = React.useMemo<ColumnDef<DetailedSite>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Asset Details',
        cell: ({ row }) => (
          <span className="font-bold text-sm text-foreground tracking-tight py-1 block">
            {row.original.name}
          </span>
        ),
      },
      {
        accessorKey: 'category',
        header: 'Asset Type',
        cell: ({ row }) => (
          <Badge
            variant="secondary"
            className="text-[10px] font-bold h-5 px-2 bg-muted/60 border-none capitalize"
          >
            {getAssetTypeLabel(row.original.category)}
          </Badge>
        ),
      },
      {
        id: 'assetFunctions',
        header: 'Asset Functions',
        cell: ({ row }) => {
          const site = row.original
          let funcLabel = 'TOAL'
          if (site.siteType === 'toal' && site.allowEmergencyLanding) {
            funcLabel = 'TOAL & Emergency Recovery'
          } else if (site.siteType === 'toal') {
            funcLabel = 'TOAL'
          } else {
            funcLabel = 'Emergency Recovery'
          }
          return (
            <Badge
              variant="outline"
              className="text-[10px] font-bold px-2 h-5 border-none bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30"
            >
              {funcLabel}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'status',
        header: 'Operational Status',
        cell: ({ row }) => {
          const site = row.original
          const currentStatus = site.status
          const isPendingOrRejected = currentStatus === 'pending' || currentStatus === 'rejected'
          const statusMeta = getStatusMeta(currentStatus)

          if (isPendingOrRejected) {
            return (
              <Badge
                className={cn(
                  'text-[9px] uppercase tracking-widest border-none font-bold h-5 px-2 cursor-default',
                  statusMeta.className,
                )}
              >
                {statusMeta.label}
              </Badge>
            )
          }

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    'text-[9px] uppercase tracking-widest font-bold h-7 px-2 border gap-1.5 cursor-pointer flex items-center justify-between min-w-32 hover:bg-muted/10',
                    statusMeta.className
                  )}
                >
                  <span>{statusMeta.label}</span>
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuLabel className="text-[9px] uppercase tracking-widest text-muted-foreground">
                  Change Status
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className={cn("cursor-pointer text-xs font-semibold py-2", currentStatus === 'active' && "bg-muted")}
                  disabled={currentStatus === 'active'}
                  onClick={() => handleStatusChangeDirectly(site.id, 'ACTIVE')}
                >
                  Active
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={cn("cursor-pointer text-xs font-semibold py-2", currentStatus === 'disabled' && "bg-muted")}
                  disabled={currentStatus === 'disabled'}
                  onClick={() => handleStatusChangeDirectly(site.id, 'DISABLE')}
                >
                  Disable
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={cn("cursor-pointer text-xs font-semibold py-2", currentStatus === 'temporary_unavailable' && "bg-muted")}
                  disabled={currentStatus === 'temporary_unavailable'}
                  onClick={() => handleStatusChangeDirectly(site.id, 'TEMPORARY_RESTRICTED')}
                >
                  Temporary Disable
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
      {
        accessorKey: 'bookingApprovalModel',
        header: 'Authorisation Model',
        cell: ({ row }) => {
          const isAuto = row.original.bookingApprovalModel === 'auto'
          return (
            <Badge
              variant="outline"
              className={cn(
                'text-[10px] font-bold px-2 h-5 border-none',
                isAuto
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30',
              )}
            >
              {isAuto ? 'Auto-approval' : 'Manual'}
            </Badge>
          )
        },
      },
      {
        id: 'utilisation',
        header: 'Utilisation',
        cell: ({ row }) => {
          const utilisation = (row.original as any).utilisation ?? 0
          return (
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-sm font-bold text-foreground">
                {utilisation}%
              </span>
              <div className="w-12 bg-muted rounded-full h-1.5 overflow-hidden hidden sm:block">
                <div
                  className="bg-primary h-1.5 rounded-full"
                  style={{ width: `${utilisation}%` }}
                />
              </div>
            </div>
          )
        },
      },
      {
        id: 'lastUsed',
        header: 'Last Used',
        cell: ({ row }) => {
          const lastUsed = (row.original as any).lastUsed
          return (
            <span className="font-mono text-xs font-semibold text-muted-foreground">
              {lastUsed !== null ? `${lastUsed} Days` : 'Never'}
            </span>
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
                  Asset Actions
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer gap-2"
                  onClick={() => router.push(`/dashboard/landowner/infrastructure/${row.original.id}`)}
                >
                  <Eye className="h-4 w-4" />
                  Preview asset
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer gap-2"
                  onClick={() => router.push(`/dashboard/landowner/infrastructure/edit/${row.original.id}`)}
                >
                  <Settings2 className="h-4 w-4" />
                  Edit details
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [handleStatusChangeDirectly, router],
  )

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
        {/* Total Registered Infrastructure Assets */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
              Total Infrastructure Assets
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

      {/* Main layout with title, description, register button, and raw table directly on the page */}
      <div className="flex flex-col gap-6 pt-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border/40">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-bold tracking-tight">
                Infrastructure Assets
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Monitor and manage your takeoff and landing infrastructure assets across the network.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
            {!isVerified ? (
              <div className="flex flex-col items-end gap-1">
                <Button
                  disabled
                  className="font-bold shadow-md opacity-50 cursor-not-allowed w-full sm:w-auto"
                >
                  <Plus className="mr-2 h-4 w-4" strokeWidth={3} />
                  REGISTER NEW ASSET
                </Button>
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-tight">
                  Verify account to add assets
                </span>
              </div>
            ) : (
              <Button
                asChild
                className="font-bold shadow-md shadow-primary/20 hover:shadow-lg transition-all w-full sm:w-auto"
              >
                <Link href="/dashboard/landowner/infrastructure/add">
                  <Plus className="mr-2 h-4 w-4" strokeWidth={3} />
                  REGISTER NEW ASSET
                </Link>
              </Button>
            )}
          </div>
        </div>

        <div className="pt-2">
          <DataTable
            columns={columns}
            data={sites}
            totalRows={sites.length}
            totalPages={Math.ceil(sites.length / pagination.pageSize) || 1}
            pagination={pagination}
            onPaginationChange={setPagination}
            isLoading={isLoading}
          />
        </div>
      </div>


    </div>
  )
}
