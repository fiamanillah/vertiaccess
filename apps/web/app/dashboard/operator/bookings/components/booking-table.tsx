'use client'

import * as React from 'react'
import { DataTable } from '@/components/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@workspace/ui/components/badge'
import { Button } from '@workspace/ui/components/button'
import {
  Calendar,
  Clock,
  MapPin,
  Eye,
  FileText,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react'
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
  onDownloadCertificate?: (booking: Booking) => void
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
  onDownloadCertificate,
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
  const pagedData = pagination
    ? data
    : data.slice(
        resolvedPagination.pageIndex * resolvedPagination.pageSize,
        (resolvedPagination.pageIndex + 1) * resolvedPagination.pageSize,
      )

  React.useEffect(() => {
    setPagination((current) =>
      current.pageIndex === 0 ? current : { ...current, pageIndex: 0 },
    )
  }, [data.length])

  const columns: ColumnDef<Booking>[] = React.useMemo(
    () => [
      {
        accessorKey: 'siteName',
        header: 'Site & Mission',
        cell: ({ row }) => (
          <div className="flex flex-col gap-1 py-1">
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-primary/60" />
              <span className="font-bold text-sm text-foreground tracking-tight">
                {row.original.siteName}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
              {row.original.bookingReference}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'startTime',
        header: 'Scheduled Date',
        cell: ({ row }) => {
          const date = new Date(row.original.startTime)
          const endDate = new Date(row.original.endTime)
          return (
            <div className="flex flex-col gap-1 font-mono">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                {format(date, 'dd MMM yyyy')}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                {format(date, 'HH:mm')} - {format(endDate, 'HH:mm')}
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: 'useCategory',
        header: 'Access Tier',
        cell: ({ row }) => {
          const isEmergency = row.original.useCategory === 'emergency_recovery'
          return (
            <div className="flex flex-col gap-1">
              <Badge
                className={cn(
                  'border-none text-[8px] font-black tracking-widest h-4 px-1.5 uppercase w-fit',
                  isEmergency
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-indigo-100 text-indigo-700',
                )}
              >
                {isEmergency ? 'Emergency Standby' : 'Planned TOAL'}
              </Badge>
              {isEmergency && (
                <span className="text-[7px] text-amber-600/70 font-bold uppercase tracking-tighter ml-0.5">
                  Paid only if used
                </span>
              )}
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
              <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1.5 text-[9px] font-bold h-5 uppercase tracking-widest">
                Awaiting confirmation
              </Badge>
            )
          }

          return (
            <Badge
              className={cn(
                'text-[9px] uppercase tracking-widest border-none font-bold h-5 px-2',
                status === 'PENDING'
                  ? 'bg-amber-100 text-amber-700'
                  : status === 'APPROVED'
                    ? 'bg-emerald-100 text-emerald-700'
                    : status === 'REJECTED'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-muted text-muted-foreground',
              )}
            >
              {status}
            </Badge>
          )
        },
      },
      {
        id: 'actions',
        header: () => <div className="text-right">Action</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">
            {row.original.status === 'APPROVED' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/5"
                    onClick={() => onDownloadCertificate?.(row.original)}
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View Certificate</TooltipContent>
              </Tooltip>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary hover:bg-primary/5 px-3"
              onClick={() => onViewDetails(row.original)}
            >
              <Eye className="h-3.5 w-3.5" />
              Details
            </Button>
          </div>
        ),
      },
    ],
    [onViewDetails, onDownloadCertificate],
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
