'use client'

import * as React from 'react'
import { DataTable } from '@/components/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@workspace/ui/components/badge'
import { Button } from '@workspace/ui/components/button'
import { Calendar, MapPin, Eye, History } from 'lucide-react'
import { Booking } from '../types'
import { cn } from '@workspace/ui/lib/utils'
import { format } from 'date-fns'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip'

interface BookingTableProps {
  data: Booking[]
  isLoading: boolean
  onViewDetails: (booking: Booking) => void
  onViewTimeline?: (booking: Booking) => void
  pagination?: { pageIndex: number; pageSize: number }
  onPaginationChange?: React.Dispatch<
    React.SetStateAction<{ pageIndex: number; pageSize: number }>
  >
  totalPages?: number
  totalRows?: number
}

export function BookingTable({
  data,
  isLoading,
  onViewDetails,
  onViewTimeline,
  pagination,
  onPaginationChange,
  totalPages,
  totalRows,
}: BookingTableProps) {
  const [internalPagination, setInternalPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const resolvedPagination = pagination ?? internalPagination
  const handlePaginationChange = onPaginationChange ?? setInternalPagination
  const resolvedTotalRows = totalRows ?? data.length
  const resolvedTotalPages =
    totalPages ??
    Math.max(Math.ceil(resolvedTotalRows / resolvedPagination.pageSize), 1)
  const effectivePageIndex = Math.min(
    resolvedPagination.pageIndex,
    Math.max(resolvedTotalPages - 1, 0),
  )
  const pagedData = pagination
    ? data
    : data.slice(
        effectivePageIndex * resolvedPagination.pageSize,
        (effectivePageIndex + 1) * resolvedPagination.pageSize,
      )

  const columns: ColumnDef<Booking>[] = React.useMemo(
    () => [
      {
        accessorKey: 'bookingReference',
        header: 'Request ID',
        cell: ({ row }) => (
          <span className="font-mono font-medium text-xs tracking-tight uppercase text-foreground bg-muted/40 px-2 py-1 rounded">
            {row.original.bookingReference}
          </span>
        ),
      },
      {
        accessorKey: 'siteName',
        header: 'Asset',
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
        header: 'Asset Capability',
        cell: ({ row }) => {
          const isEmergency = row.original.useCategory === 'emergency_recovery'
          return (
            <div className="flex flex-col gap-1">
              <Badge
                className={cn(
                  'border-none text-xs font-semibold h-5 px-2 w-fit',
                  isEmergency
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-indigo-100 text-indigo-700',
                )}
              >
                {isEmergency ? 'Emergency and Recovery' : 'Planned TOAL'}
              </Badge>
              {isEmergency && (
                <span className="text-[10px] text-amber-600/70 font-semibold ml-0.5">
                  Paid only if used
                </span>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: 'missionIntent',
        header: 'Mission',
        cell: ({ row }) => {
          const intent = row.original.missionIntent || ''
          const formattedIntent = intent
            ? intent.charAt(0).toUpperCase() + intent.slice(1).toLowerCase()
            : 'N/A'
          return (
            <span className="text-sm font-medium text-foreground">
              {formattedIntent}
            </span>
          )
        },
      },
      {
        accessorKey: 'operationType',
        header: 'Operation Type',
        cell: ({ row }) => {
          const opType = row.original.operationType
          if (!opType) return <span className="text-muted-foreground text-xs">-</span>
          return (
            <Badge
              className={cn(
                'border-none text-xs font-semibold h-5 px-2 w-fit',
                opType === 'INBOUND'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-purple-100 text-purple-700',
              )}
            >
              {opType === 'INBOUND' ? 'Inbound' : 'Outbound'}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'startTime',
        header: 'Operation Window',
        cell: ({ row }) => {
          const date = new Date(row.original.startTime)
          return (
            <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-foreground">
              <Calendar className="h-3.5 w-3.5 text-primary/60 shrink-0" />
              {format(date, 'dd-MM-yyyy HH:mm')}
            </div>
          )
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status
          const isPast = new Date(row.original.endTime) < new Date()
          const isEmergency = row.original.useCategory === 'emergency_recovery'

          if (
            status === 'APPROVED' &&
            isEmergency &&
            isPast &&
            row.original.paymentStatus === 'pending'
          ) {
            return (
              <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1.5 text-xs font-semibold h-6 px-2.5">
                Awaiting Confirmation
              </Badge>
            )
          }

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
              {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
            </Badge>
          )
        },
      },
      {
        id: 'actions',
        header: 'Action',
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">
            {onViewTimeline && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/5"
                    onClick={() => onViewTimeline(row.original)}
                  >
                    <History className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View Timeline</TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/5"
                  onClick={() => onViewDetails(row.original)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View Details</TooltipContent>
            </Tooltip>
          </div>
        ),
      },
    ],
    [onViewDetails, onViewTimeline],
  )

  return (
    <TooltipProvider>
      <div className="rounded-xl border border-border/50 bg-background/50 backdrop-blur-sm overflow-hidden shadow-sm">
        <DataTable
          columns={columns}
          data={pagedData}
          totalRows={resolvedTotalRows}
          totalPages={resolvedTotalPages}
          pagination={resolvedPagination}
          onPaginationChange={handlePaginationChange}
          isLoading={isLoading}
        />
      </div>
    </TooltipProvider>
  )
}
