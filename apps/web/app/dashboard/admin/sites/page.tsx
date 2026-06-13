'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { cn } from '@workspace/ui/lib/utils';
import { toast } from 'sonner';

import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { DataTable } from '@/components/data-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip';
import {
  AlertTriangle,
  ChevronDown,
  Eye,
  Loader2,
  MapPin,
  Search,
} from 'lucide-react';

import { siteService } from '@/services/site.service';

interface SiteRow {
  id: string;
  vaId: string;
  name: string;
  address: string;
  postcode: string;
  category: string;
  siteType: 'toal' | 'emergency';
  status: 'active' | 'pending' | 'disabled' | 'temporary_unavailable' | 'rejected';
  rawStatus: string;
  toalFee: number;
  emergencyFee: number;
  allowEmergencyLanding: boolean;
  ownerName: string;
  ownerEmail: string;
  createdAt: string;
  reason?: string;
  bookingApprovalModel: 'auto' | 'manual';
}

function getStatusMeta(status: string) {
  switch (status) {
    case 'active':
      return {
        label: 'ACTIVE',
        className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none',
      };
    case 'pending':
      return {
        label: 'PENDING REVIEW',
        className: 'bg-amber-100 text-amber-700 hover:bg-amber-100 border-none',
      };
    case 'disabled':
      return {
        label: 'DISABLED',
        className: 'bg-slate-100 text-slate-700 hover:bg-slate-100 border-none',
      };
    case 'temporary_unavailable':
      return {
        label: 'TEMPORARILY UNAVAILABLE',
        className: 'bg-orange-100 text-orange-700 hover:bg-orange-100 border-none',
      };
    default:
      return {
        label: 'REJECTED',
        className: 'bg-red-100 text-red-700 hover:bg-red-100 border-none',
      };
  }
}

function getAssetTypeLabel(category: string) {
  const mapping: Record<string, string> = {
    private_land: 'Private Land',
    helipad: 'Helipad',
    vertiport: 'Vertiport',
    droneport: 'Drone Port',
    temporary_landing_site: 'Temporary Landing Site',
  };
  return mapping[category] || category.replace(/_/g, ' ');
}

function mapBackendSiteToRow(s: any): SiteRow {
  let mappedStatus: SiteRow['status'] = 'pending';
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
    vaId: s.vaId || s.id.slice(0, 8).toUpperCase(),
    name: s.name,
    address: s.address,
    postcode: s.postcode,
    category: s.siteCategory || 'Urban Operations',
    siteType: s.siteType || 'toal',
    status: mappedStatus,
    rawStatus: s.status,
    toalFee: Number(s.toalAccessFee) || 0,
    emergencyFee: Number(s.clzAccessFee) || 0,
    allowEmergencyLanding: !!(s.clzEnabled || s.emergencyRecoveryEnabled),
    ownerName: s.assetManager?.assetManagerProfile?.fullName || 'N/A',
    ownerEmail: s.assetManager?.email || 'N/A',
    createdAt: s.createdAt,
    reason: s.rejectionReasonNote || s.adminNote || undefined,
    bookingApprovalModel: s.autoApprove ? 'auto' : 'manual',
  };
}

export default function AdminSitesPage() {
  const router = useRouter();
  const [sites, setSites] = React.useState<SiteRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [changingStatusIds, setChangingStatusIds] = React.useState<Record<string, boolean>>({});

  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  React.useEffect(() => {
    async function fetchSites() {
      setIsLoading(true);
      try {
        const res = await siteService.listSites();
        if (res.success && Array.isArray(res.data)) {
          setSites(res.data.map(mapBackendSiteToRow));
        } else {
          setSites([]);
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to load sites');
      } finally {
        setIsLoading(false);
      }
    }

    void fetchSites();
  }, [refreshTrigger]);

  const handleStatusChange = React.useCallback(
    async (
      siteId: string,
      status: 'ACTIVE' | 'DISABLE' | 'TEMPORARY_RESTRICTED' | 'UNDER_REVIEW' | 'REJECTED' | 'WITHDRAWN',
    ) => {
      setChangingStatusIds((prev) => ({ ...prev, [siteId]: true }));
      try {
        const response = await siteService.updateSiteStatus(siteId, {
          status,
        });

        if (!response.success) {
          throw new Error(response.message || 'Unable to update status');
        }

        // Remap target operational status
        let mappedStatus: SiteRow['status'] = 'pending';
        if (status === 'ACTIVE') mappedStatus = 'active';
        else if (status === 'DISABLE') mappedStatus = 'disabled';
        else if (status === 'TEMPORARY_RESTRICTED') mappedStatus = 'temporary_unavailable';
        else if (status === 'REJECTED' || status === 'WITHDRAWN') mappedStatus = 'rejected';

        setSites((current) =>
          current.map((site) =>
            site.id === siteId
              ? {
                  ...site,
                  status: mappedStatus,
                  rawStatus: status,
                }
              : site,
          ),
        );

        toast.success('Operational status updated', {
          description: response.message || `The operational status has been updated successfully.`,
        });
      } catch (err: any) {
        toast.error('Failed to update status', {
          description: err?.message || 'The status change could not be saved.',
        });
      } finally {
        setChangingStatusIds((prev) => ({ ...prev, [siteId]: false }));
      }
    },
    [],
  );

  // Filter logic
  const filteredSites = React.useMemo(() => {
    return sites.filter((site) => {
      // 1. Search Query Filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        site.name.toLowerCase().includes(searchLower) ||
        site.vaId.toLowerCase().includes(searchLower) ||
        site.address.toLowerCase().includes(searchLower) ||
        site.postcode.toLowerCase().includes(searchLower) ||
        site.ownerName.toLowerCase().includes(searchLower) ||
        site.ownerEmail.toLowerCase().includes(searchLower);

      // 2. Status Filter
      const matchesStatus =
        statusFilter === 'all' || site.rawStatus.toUpperCase() === statusFilter.toUpperCase();

      return matchesSearch && matchesStatus;
    });
  }, [sites, searchQuery, statusFilter]);

  // Reset page index on query changes
  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [searchQuery, statusFilter]);

  // Paginated slice
  const pagedData = React.useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize;
    const end = start + pagination.pageSize;
    return filteredSites.slice(start, end);
  }, [filteredSites, pagination]);

  const columns = React.useMemo<ColumnDef<SiteRow>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Asset Name & Ref',
        cell: ({ row }) => {
          const site = row.original;
          return (
            <div className="flex flex-col py-1">
              <span className="font-bold text-sm text-foreground tracking-tight">
                {site.name}
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="font-mono text-[10px] bg-muted/50 text-muted-foreground px-1.5 py-0.5 rounded uppercase font-medium">
                  {site.vaId}
                </span>
                <Badge
                  variant="secondary"
                  className="text-[9px] font-semibold h-4.5 px-1.5 capitalize bg-muted/30 border-none"
                >
                  {getAssetTypeLabel(site.category)}
                </Badge>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'ownerName',
        header: 'Asset Manager',
        cell: ({ row }) => {
          const site = row.original;
          return (
            <div className="flex flex-col py-1">
              <span className="font-semibold text-sm text-foreground">
                {site.ownerName}
              </span>
              <span className="text-xs text-muted-foreground font-medium mt-0.5">
                {site.ownerEmail}
              </span>
            </div>
          );
        },
      },
      {
        id: 'capabilities',
        header: 'Capability & Model',
        cell: ({ row }) => {
          const site = row.original;
          let capLabel = 'TOAL';
          if (site.siteType === 'toal' && site.allowEmergencyLanding) {
            capLabel = 'TOAL & Emergency';
          } else if (site.siteType === 'toal') {
            capLabel = 'TOAL Only';
          } else {
            capLabel = 'Emergency Only';
          }

          const isAuto = site.bookingApprovalModel === 'auto';

          return (
            <div className="flex flex-col gap-1.5 py-1">
              <Badge
                variant="outline"
                className="text-[10px] font-bold px-2 h-5 w-fit border-none bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30"
              >
                {capLabel}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  'text-[9px] font-bold px-1.5 h-4.5 w-fit border-none',
                  isAuto
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30',
                )}
              >
                {isAuto ? 'Auto-Approval' : 'Manual'}
              </Badge>
            </div>
          );
        },
      },
      {
        id: 'validity',
        header: 'Pricing',
        cell: ({ row }) => {
          const site = row.original;
          return (
            <div className="flex flex-col py-1 text-sm">
              <span className="font-semibold text-foreground">
                TOAL: £{site.toalFee.toFixed(2)}
              </span>
              {site.allowEmergencyLanding && (
                <span className="text-xs text-muted-foreground font-medium mt-0.5">
                  ER: £{site.emergencyFee.toFixed(2)}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Operational Status',
        cell: ({ row }) => {
          const site = row.original;
          const currentStatus = site.status;
          const statusMeta = getStatusMeta(currentStatus);
          const isUpdating = !!changingStatusIds[site.id];

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
              <DropdownMenuContent align="start" className="w-52">
                <DropdownMenuLabel className="text-[9px] uppercase tracking-widest text-muted-foreground">
                  Change Status
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className={cn('cursor-pointer text-xs font-semibold py-2', site.rawStatus === 'ACTIVE' && 'bg-muted')}
                  disabled={site.rawStatus === 'ACTIVE' || isUpdating}
                  onClick={() => handleStatusChange(site.id, 'ACTIVE')}
                >
                  Active
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={cn('cursor-pointer text-xs font-semibold py-2', site.rawStatus === 'DISABLE' && 'bg-muted')}
                  disabled={site.rawStatus === 'DISABLE' || isUpdating}
                  onClick={() => handleStatusChange(site.id, 'DISABLE')}
                >
                  Disable
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={cn('cursor-pointer text-xs font-semibold py-2', site.rawStatus === 'TEMPORARY_RESTRICTED' && 'bg-muted')}
                  disabled={site.rawStatus === 'TEMPORARY_RESTRICTED' || isUpdating}
                  onClick={() => handleStatusChange(site.id, 'TEMPORARY_RESTRICTED')}
                >
                  Temporary Disable
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={cn('cursor-pointer text-xs font-semibold py-2', site.rawStatus === 'UNDER_REVIEW' && 'bg-muted')}
                  disabled={site.rawStatus === 'UNDER_REVIEW' || isUpdating}
                  onClick={() => handleStatusChange(site.id, 'UNDER_REVIEW')}
                >
                  Needs Review / Under Review
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={cn('cursor-pointer text-xs font-semibold py-2', site.rawStatus === 'REJECTED' && 'bg-muted')}
                  disabled={site.rawStatus === 'REJECTED' || isUpdating}
                  onClick={() => handleStatusChange(site.id, 'REJECTED')}
                >
                  Rejected
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={cn('cursor-pointer text-xs font-semibold py-2', site.rawStatus === 'WITHDRAWN' && 'bg-muted')}
                  disabled={site.rawStatus === 'WITHDRAWN' || isUpdating}
                  onClick={() => handleStatusChange(site.id, 'WITHDRAWN')}
                >
                  Withdrawn
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
    [handleStatusChange, changingStatusIds, router],
  );

  return (
    <div className="flex flex-1 flex-col gap-6 max-w-7xl mx-auto p-4 md:p-6 w-full animate-in fade-in duration-500 text-foreground">
      {/* Welcome Header */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
          Infrastructure Assets
        </h1>
        <p className="text-sm text-muted-foreground font-medium">
          Manage and monitor all landing sites registered on the platform.
        </p>
      </div>

      {/* Filter Options */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-muted/20 border border-border/40 p-4 rounded-xl">
        <div className="relative w-full sm:max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </span>
          <input
            type="text"
            placeholder="Search site name, ref, address, manager..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-input bg-background/50 px-3 py-2 pl-9 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 w-44 rounded-lg border border-input bg-background/50 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-semibold text-foreground capitalize"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="under_review">Under Review</option>
            <option value="disable">Disabled</option>
            <option value="temporary_restricted">Temporarily Restricted</option>
            <option value="rejected">Rejected</option>
            <option value="withdrawn">Withdrawn</option>
          </select>
        </div>
      </div>

      {/* Datatable */}
      <div className="rounded-xl border border-border/50 bg-background/50 backdrop-blur-sm overflow-hidden shadow-sm p-4">
        <DataTable
          columns={columns}
          data={pagedData}
          totalRows={filteredSites.length}
          totalPages={Math.max(Math.ceil(filteredSites.length / pagination.pageSize), 1)}
          pagination={pagination}
          onPaginationChange={setPagination}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
