'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@workspace/ui/components/button';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { Badge } from '@workspace/ui/components/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { DataTable } from '@/components/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { cn } from '@workspace/ui/lib/utils';
import {
  ArrowLeft,
  Loader2,
  User as UserIcon,
  ChevronDown,
  AlertTriangle,
  Eye,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';

import { adminService } from '@/services/admin.service';
import { siteService } from '@/services/site.service';
import { bookingService } from '@/services/booking.service';
import { incidentQueryService } from '@/services/incident-query.service';

import UserDetailsCard from './components/user-details-card';
import UserActionsCard from './components/user-actions-card';
import { IncidentReportTable } from '@/app/dashboard/admin/incident-report/components/incident-report-table';
import { BookingTable } from '@/app/dashboard/operator/bookings/components/booking-table';
import { SiteOperationsDialog } from './components/site-operations-dialog';

function getStatusMeta(status: string) {
  if (status === 'active') {
    return {
      label: 'ACTIVE',
      className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
    };
  }

  if (status === 'pending') {
    return {
      label: 'PENDING REVIEW',
      className: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
    };
  }

  if (status === 'disabled') {
    return {
      label: 'DISABLED',
      className: 'bg-slate-100 text-slate-700 hover:bg-slate-100',
    };
  }

  if (status === 'temporary_unavailable') {
    return {
      label: 'TEMPORARILY UNAVAILABLE',
      className: 'bg-orange-100 text-orange-700 hover:bg-orange-100',
    };
  }

  return {
    label: 'REJECTED',
    className: 'bg-red-100 text-red-700 hover:bg-red-100',
  };
}

function getAssetTypeLabel(category: string) {
  const mapping: Record<string, string> = {
    private_land: 'Private Land',
    helipad: 'Helipad',
    vertiport: 'Vertiport',
    droneport: 'Drone Port',
    temporary_landing_site: 'Temporary Landing Site',
  };
  return mapping[category] || category;
}

function mapBackendSiteToDetailedSite(s: any): any {
  const geometry = s.geometry || {};
  const clzGeometry = s.clzGeometry || {};

  const toalPolygonPoints =
    geometry.type === 'polygon' && geometry.points
      ? geometry.points.map((p: any) => [p.lat, p.lng] as [number, number])
      : [];

  const emergencyPolygonPoints =
    clzGeometry.type === 'polygon' && clzGeometry.points
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

  let mappedStatus = 'pending';
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
  };
}

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  // Additional detail states
  const [sites, setSites] = React.useState<any[]>([]);
  const [incidents, setIncidents] = React.useState<any[]>([]);
  const [bookings, setBookings] = React.useState<any[]>([]);

  const [isSitesLoading, setIsSitesLoading] = React.useState(false);
  const [isIncidentsLoading, setIsIncidentsLoading] = React.useState(false);
  const [isBookingsLoading, setIsBookingsLoading] = React.useState(false);

  const [selectedSiteForOperations, setSelectedSiteForOperations] = React.useState<any | null>(null);
  const [isOperationsDialogOpen, setIsOperationsDialogOpen] = React.useState(false);

  const [changingStatusSiteIds, setChangingStatusSiteIds] = React.useState<
    Record<string, boolean>
  >({});

  const [sitePagination, setSitePagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const fetchUserDetails = React.useCallback(async () => {
    if (!params.id) return;
    setIsLoading(true);
    try {
      const res = await adminService.getUser(params.id);
      if (res.success) {
        setUser(res.data);
      } else {
        toast.error(res.message || 'Failed to fetch user details');
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred while loading user profile');
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  React.useEffect(() => {
    fetchUserDetails();
  }, [fetchUserDetails, refreshTrigger]);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleStatusChangeDirectly = React.useCallback(
    async (
      siteId: string,
      status: 'ACTIVE' | 'DISABLE' | 'TEMPORARY_RESTRICTED',
    ) => {
      setChangingStatusSiteIds((prev) => ({ ...prev, [siteId]: true }));
      try {
        const response = await siteService.updateSiteStatus(siteId, {
          status,
        });

        if (!response.success) {
          throw new Error(response.message || 'Unable to update status');
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
        );

        toast.success('Operational status updated', {
          description:
            response.message || `The operational status has been updated.`,
        });
      } catch (err: any) {
        toast.error('Failed to update status', {
          description: err?.message || 'The status change could not be saved.',
        });
      } finally {
        setChangingStatusSiteIds((prev) => ({ ...prev, [siteId]: false }));
      }
    },
    [],
  );

  const loadSites = React.useCallback(async () => {
    if (!user || user.role !== 'assetmanager') return;
    setIsSitesLoading(true);
    try {
      const res = await siteService.listSites({ assetManagerId: user.id });
      if (res.success && Array.isArray(res.data)) {
        setSites(res.data.map(mapBackendSiteToDetailedSite));
      } else {
        setSites([]);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load sites');
    } finally {
      setIsSitesLoading(false);
    }
  }, [user]);

  const loadBookings = React.useCallback(async () => {
    if (!user || user.role !== 'operator') return;
    setIsBookingsLoading(true);
    try {
      const res = await bookingService.listAssetManagerBookings({
        operatorId: user.id,
        limit: 100,
      });
      if (res.success && Array.isArray(res.data)) {
        setBookings(res.data);
      } else {
        setBookings([]);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load bookings');
    } finally {
      setIsBookingsLoading(false);
    }
  }, [user]);

  const loadIncidents = React.useCallback(async () => {
    if (!user) return;
    setIsIncidentsLoading(true);
    try {
      const data = await incidentQueryService.listIncidents();
      const filtered = data.filter(
        (inc: any) =>
          inc.reporterId === user.id ||
          inc.targetId === user.id ||
          inc.operatorId === user.id ||
          inc.assetManagerId === user.id,
      );
      setIncidents(filtered);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load incidents');
    } finally {
      setIsIncidentsLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    if (user) {
      if (user.role === 'assetmanager') {
        loadSites();
        loadIncidents();
      } else if (user.role === 'operator') {
        loadBookings();
        loadIncidents();
      }
    }
  }, [user, loadSites, loadBookings, loadIncidents]);

  const assetColumns = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Asset Name',
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
          const site = row.original;
          let funcLabel = 'TOAL';
          if (site.siteType === 'toal' && site.allowEmergencyLanding) {
            funcLabel = 'TOAL & Emergency Recovery';
          } else if (site.siteType === 'toal') {
            funcLabel = 'TOAL';
          } else {
            funcLabel = 'Emergency Recovery';
          }
          return (
            <Badge
              variant="outline"
              className="text-[10px] font-bold px-2 h-5 border-none bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30"
            >
              {funcLabel}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Operational Status',
        cell: ({ row }) => {
          const site = row.original;
          const currentStatus = site.status;
          const isPendingOrRejected =
            currentStatus === 'pending' || currentStatus === 'rejected';
          const statusMeta = getStatusMeta(currentStatus);
          const isUpdating = !!changingStatusSiteIds[site.id];

          if (isPendingOrRejected) {
            return (
              <div className="flex items-center gap-1.5">
                <Badge
                  className={cn(
                    'text-[9px] uppercase tracking-widest border-none font-bold h-5 px-2 cursor-default',
                    statusMeta.className,
                  )}
                >
                  {statusMeta.label}
                </Badge>
                {currentStatus === 'rejected' && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-red-500 hover:text-red-600 cursor-pointer transition-transform duration-200 hover:scale-110 flex items-center justify-center size-6 rounded-full bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 shadow-sm relative">
                          <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-20 animate-ping" />
                          <AlertTriangle className="h-3.5 w-3.5" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="bg-destructive text-destructive-foreground p-2 text-xs rounded shadow-md max-w-xs">
                        <p className="font-semibold">Rejection Comment:</p>
                        <p>{site.reason || 'No comments provided.'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            );
          }

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isUpdating}
                  className={cn(
                    'text-[9px] uppercase tracking-widest font-bold h-7 px-2 border gap-1.5 cursor-pointer flex items-center justify-between min-w-32 hover:bg-muted/10',
                    statusMeta.className,
                    isUpdating && 'opacity-70 cursor-not-allowed',
                  )}
                >
                  <span>{isUpdating ? 'Updating...' : statusMeta.label}</span>
                  {isUpdating ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuLabel className="text-[9px] uppercase tracking-widest text-muted-foreground">
                  Change Status
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className={cn(
                    'cursor-pointer text-xs font-semibold py-2',
                    currentStatus === 'active' && 'bg-muted',
                  )}
                  disabled={currentStatus === 'active' || isUpdating}
                  onClick={() => handleStatusChangeDirectly(site.id, 'ACTIVE')}
                >
                  Active
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={cn(
                    'cursor-pointer text-xs font-semibold py-2',
                    currentStatus === 'disabled' && 'bg-muted',
                  )}
                  disabled={currentStatus === 'disabled' || isUpdating}
                  onClick={() => handleStatusChangeDirectly(site.id, 'DISABLE')}
                >
                  Disable
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={cn(
                    'cursor-pointer text-xs font-semibold py-2',
                    currentStatus === 'temporary_unavailable' && 'bg-muted',
                  )}
                  disabled={
                    currentStatus === 'temporary_unavailable' || isUpdating
                  }
                  onClick={() =>
                    handleStatusChangeDirectly(site.id, 'TEMPORARY_RESTRICTED')
                  }
                >
                  Temporary Disable
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
      {
        accessorKey: 'bookingApprovalModel',
        header: 'Authorisation Model',
        cell: ({ row }) => {
          const isAuto = row.original.bookingApprovalModel === 'auto';
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
          );
        },
      },
      {
        id: 'utilisation',
        header: 'Utilisation',
        cell: ({ row }) => {
          const utilisation = row.original.utilisation ?? 0;
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
          );
        },
      },
      {
        id: 'lastUsed',
        header: 'Last Used',
        cell: ({ row }) => {
          const lastUsed = row.original.lastUsed;
          if (lastUsed === null || lastUsed === undefined) {
            return (
              <span className="font-mono text-xs font-semibold text-muted-foreground">
                0
              </span>
            );
          }
          return (
            <span className="font-mono text-xs font-semibold text-muted-foreground">
              {lastUsed} {lastUsed === 1 ? 'day' : 'days'}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/5"
                    onClick={() => {
                      setSelectedSiteForOperations(row.original);
                      setIsOperationsDialogOpen(true);
                    }}
                  >
                    <Calendar className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">View Operations</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/5"
                    onClick={() =>
                      router.push(
                        `/dashboard/assetmanager/infrastructure/${row.original.id}`,
                      )
                    }
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">View Asset Details</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ),
      },
    ],
    [handleStatusChangeDirectly, router, changingStatusSiteIds],
  );

  if (isLoading && !user) {
    return (
      <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="flex flex-col gap-6">
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[250px] w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center min-h-[50vh] gap-4">
        <div className="bg-muted p-4 rounded-full">
          <UserIcon className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold">User Not Found</h2>
        <p className="text-muted-foreground max-w-sm">
          The requested user account could not be found or has been permanently deactivated.
        </p>
        <Button onClick={() => router.push('/dashboard/admin/users')} variant="outline">
          Back to User Management
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto">
      {/* Header and Back Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard/admin/users')}
            className="flex items-center gap-1.5 border-border/60 hover:bg-muted font-semibold"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <div className="space-y-0.5">
            <h1 className="text-2xl font-bold tracking-tight">Manage {user.displayName}</h1>
            <p className="text-xs text-muted-foreground">
              Review profile fields, update system status, and configure billing bypasses.
            </p>
          </div>
        </div>
      </div>

      {/* Stack of details and operations */}
      <div className="flex flex-col gap-6">
        <UserDetailsCard user={user} />
        <UserActionsCard user={user} onActionComplete={handleRefresh} />

        {/* Dynamic tab list based on role */}
        {(user.role === 'assetmanager' || user.role === 'operator') && (
          <div className="mt-4">
            <Tabs defaultValue="primary-list" className="w-full">
              <TabsList className="grid w-full max-w-[400px] grid-cols-2 bg-muted/60 p-1 rounded-xl">
                <TabsTrigger value="primary-list" className="rounded-lg font-bold text-xs">
                  {user.role === 'assetmanager' ? 'Assets Managed' : 'Drone Operations'}
                </TabsTrigger>
                <TabsTrigger value="incidents-list" className="rounded-lg font-bold text-xs">
                  Incidents
                </TabsTrigger>
              </TabsList>

              <TabsContent value="primary-list" className="mt-4">
                {user.role === 'assetmanager' ? (
                  <div className="rounded-xl border border-border/50 bg-background/50 backdrop-blur-sm overflow-hidden shadow-sm p-4">
                    <h3 className="text-sm font-bold text-foreground mb-4">Infrastructure Assets</h3>
                    <DataTable
                      columns={assetColumns}
                      data={sites}
                      totalRows={sites.length}
                      totalPages={Math.ceil(sites.length / sitePagination.pageSize) || 1}
                      pagination={sitePagination}
                      onPaginationChange={setSitePagination}
                      isLoading={isSitesLoading}
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-foreground">Flight Bookings & Operations</h3>
                    <BookingTable
                      data={bookings}
                      isLoading={isBookingsLoading}
                      onViewDetails={(booking) =>
                        router.push(`/dashboard/operator/bookings/${booking.id}`)
                      }
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="incidents-list" className="mt-4">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-foreground">Safety Investigations & Incidents</h3>
                  <IncidentReportTable
                    data={incidents}
                    isLoading={isIncidentsLoading}
                    baseUrl="/dashboard/admin/incident-report"
                    isAdmin={true}
                    searchQuery=""
                    sortQuery="updatedAt"
                    sortOrder="desc"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      <SiteOperationsDialog
        isOpen={isOperationsDialogOpen}
        onClose={() => setIsOperationsDialogOpen(false)}
        site={selectedSiteForOperations}
        assetManagerId={user.id}
      />
    </div>
  );
}
