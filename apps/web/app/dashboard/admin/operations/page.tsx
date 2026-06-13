'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { cn } from '@workspace/ui/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';

import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { DataTable } from '@/components/data-table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip';
import {
  Calendar,
  Eye,
  Loader2,
  MapPin,
  Search,
} from 'lucide-react';

import { bookingService } from '@/services/booking.service';
import { Booking } from '@/app/dashboard/operator/bookings/types';

export default function AdminOperationsPage() {
  const router = useRouter();
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [capabilityFilter, setCapabilityFilter] = React.useState<string>('all');

  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalRows, setTotalRows] = React.useState(0);

  // Debounce search query to prevent constant API requests
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }, 400);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Reset pageIndex on filter changes
  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [statusFilter, capabilityFilter]);

  const fetchBookings = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const page = pagination.pageIndex + 1;
      const limit = pagination.pageSize;

      const res = await bookingService.listAssetManagerBookings({
        page,
        limit,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        useCategory: capabilityFilter !== 'all' ? (capabilityFilter as any) : undefined,
        query: debouncedSearchQuery || undefined,
      });

      if (res.success && Array.isArray(res.data)) {
        setBookings(res.data as unknown as Booking[]);
        if (res.meta?.pagination) {
          setTotalPages(res.meta.pagination.totalPages);
          setTotalRows(res.meta.pagination.total);
        }
      } else {
        setBookings([]);
        setTotalPages(1);
        setTotalRows(0);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load flight bookings');
      setBookings([]);
      setTotalPages(1);
      setTotalRows(0);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.pageIndex, pagination.pageSize, statusFilter, capabilityFilter, debouncedSearchQuery]);

  React.useEffect(() => {
    void fetchBookings();
  }, [fetchBookings]);

  const columns = React.useMemo<ColumnDef<Booking>[]>(
    () => [
      {
        accessorKey: 'bookingReference',
        header: 'Request ID',
        cell: ({ row }) => (
          <span className="font-mono font-semibold text-xs tracking-tight uppercase text-foreground bg-muted/40 px-2 py-1 rounded">
            {row.original.bookingReference}
          </span>
        ),
      },
      {
        accessorKey: 'operatorName',
        header: 'Operator',
        cell: ({ row }) => {
          const booking = row.original;
          return (
            <div className="flex flex-col py-1">
              <span className="font-semibold text-sm text-foreground">
                {booking.operatorName || 'N/A'}
              </span>
              <span className="text-xs text-muted-foreground font-medium mt-0.5">
                {booking.operatorEmail || 'N/A'}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'siteName',
        header: 'Asset / Site',
        cell: ({ row }) => (
          <div className="flex items-center gap-2 py-1">
            <MapPin className="h-3.5 w-3.5 text-primary/60 shrink-0" />
            <span className="font-bold text-sm text-foreground tracking-tight">
              {row.original.siteName || 'N/A'}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'useCategory',
        header: 'Capability & Operation',
        cell: ({ row }) => {
          const isEmergency = row.original.useCategory === 'emergency_recovery';
          const opType = row.original.operationType;

          return (
            <div className="flex flex-col gap-1.5 py-1">
              <Badge
                className={cn(
                  'border-none text-[10px] font-bold h-5 px-2 w-fit',
                  isEmergency ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700',
                )}
              >
                {isEmergency ? 'Emergency Recovery' : 'Planned TOAL'}
              </Badge>
              {opType && (
                <Badge
                  className={cn(
                    'border-none text-[9px] font-bold h-4.5 px-1.5 w-fit',
                    opType === 'INBOUND' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700',
                  )}
                >
                  {opType === 'INBOUND' ? 'Inbound' : 'Outbound'}
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'startTime',
        header: 'Operation Window',
        cell: ({ row }) => {
          const start = new Date(row.original.startTime);
          const end = new Date(row.original.endTime);
          return (
            <div className="flex flex-col py-1 text-xs font-mono font-medium text-foreground gap-0.5">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-primary/60 shrink-0" />
                <span>Start: {format(start, 'dd-MM-yyyy HH:mm')}</span>
              </div>
              <div className="flex items-center gap-1 pl-4">
                <span>End: {format(end, 'dd-MM-yyyy HH:mm')}</span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <Badge
              className={cn(
                'text-xs border-none font-semibold h-6 px-2.5',
                status === 'PENDING'
                  ? 'bg-amber-100 text-amber-700'
                  : status === 'APPROVED'
                    ? 'bg-emerald-100 text-emerald-700'
                    : status === 'ACTIVATED'
                      ? 'bg-blue-100 text-blue-700'
                      : status === 'COMPLETED'
                        ? 'bg-indigo-100 text-indigo-700'
                        : status === 'REJECTED'
                          ? 'bg-red-100 text-red-700'
                          : status === 'EXPIRED'
                            ? 'bg-slate-100 text-slate-700'
                            : status === 'CANCELLED'
                              ? 'bg-zinc-100 text-zinc-500'
                              : 'bg-muted text-muted-foreground',
              )}
            >
              {status}
            </Badge>
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
                        `/dashboard/operator/bookings/${row.original.id}`,
                      )
                    }
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">View Operation Details</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ),
      },
    ],
    [router],
  );

  return (
    <div className="flex flex-1 flex-col gap-6 max-w-7xl mx-auto p-4 md:p-6 w-full animate-in fade-in duration-500 text-foreground">
      {/* Welcome Header */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
          Drone Operations
        </h1>
        <p className="text-sm text-muted-foreground font-medium">
          Monitor and manage all flight bookings and drone operations across the platform.
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
            placeholder="Search request ID, operator, site..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-input bg-background/50 px-3 py-2 pl-9 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto shrink-0 justify-end">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Capability:</span>
            <select
              value={capabilityFilter}
              onChange={(e) => setCapabilityFilter(e.target.value)}
              className="h-10 w-40 rounded-lg border border-input bg-background/50 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-semibold text-foreground capitalize"
            >
              <option value="all">All</option>
              <option value="planned_toal">Planned TOAL</option>
              <option value="emergency_recovery">Emergency Recovery</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 w-36 rounded-lg border border-input bg-background/50 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-semibold text-foreground capitalize"
            >
              <option value="all">All</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="ACTIVATED">Activated</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Datatable */}
      <div className="rounded-xl border border-border/50 bg-background/50 backdrop-blur-sm overflow-hidden shadow-sm p-4">
        <DataTable
          columns={columns}
          data={bookings}
          totalRows={totalRows}
          totalPages={totalPages}
          pagination={pagination}
          onPaginationChange={setPagination}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
