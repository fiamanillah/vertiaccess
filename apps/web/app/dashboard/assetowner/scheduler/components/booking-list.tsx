'use client'

import * as React from 'react'
import Link from 'next/link'
import { DataTable } from '@/components/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@workspace/ui/components/badge'
import { Button } from '@workspace/ui/components/button'
import {
  Eye,
  ArrowRight,
  History,
  FileText,
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
import { AlertTriangle } from 'lucide-react'

interface BookingListProps {
  data: Booking[]
  isLoading: boolean
  onReview: (booking: Booking) => void
  onViewTimeline?: (booking: Booking) => void
  showReviewButton?: boolean
  pagination?: { pageIndex: number; pageSize: number }
  onPaginationChange?: React.Dispatch<
    React.SetStateAction<{ pageIndex: number; pageSize: number }>
  >
  totalPages?: number
  totalRows?: number
}

export function BookingList({
  data,
  isLoading,
  onReview,
  onViewTimeline,
  showReviewButton = false,
  pagination,
  onPaginationChange,
  totalPages,
  totalRows,
}: BookingListProps) {
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

  const columns: ColumnDef<Booking>[] = React.useMemo(
    () => [
      {
        accessorKey: 'bookingReference',
        header: 'Reference',
        cell: ({ row }) => (
          <span className="font-mono font-bold text-xs text-foreground">
            {row.original.bookingReference}
          </span>
        ),
      },
      {
        accessorKey: 'operatorOrganisation',
        header: 'Organisation',
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-sm text-foreground">
              {row.original.operatorOrganisation || 'Independent'}
            </span>
            {row.original.operatorOrganisation && row.original.operatorName && (
              <span className="text-[10px] text-muted-foreground font-medium">
                {row.original.operatorName}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'siteName',
        header: 'Requested Asset',
        cell: ({ row }) => (
          <span className="font-medium text-xs text-foreground">
            {row.original.siteName || 'N/A'}
          </span>
        ),
      },
      {
        accessorKey: 'useCategory',
        header: 'Requested Capability',
        cell: ({ row }) => {
          const isEmergency = row.original.useCategory === 'emergency_recovery'
          return (
            <Badge
              className={cn(
                'text-[9px] uppercase tracking-wider border-none font-bold h-5 px-2.5',
                isEmergency
                  ? 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                  : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-100',
              )}
            >
              {isEmergency ? 'Emergency and recovery' : 'Planned TOAL'}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'startTime',
        header: 'Scheduled Access',
        cell: ({ row }) => {
          const date = new Date(row.original.startTime)
          return (
            <span className="font-mono text-xs font-medium text-foreground">
              {format(date, 'dd-MM-yyyy HH:mm')}
            </span>
          )
        },
      },
      {
        accessorKey: 'toalCost',
        header: 'Revenue',
        cell: ({ row }) => {
          const booking = row.original
          const isCancelled = booking.status === 'CANCELLED'
          const cancellationFee = booking.cancellationFee ?? 0
          const toalCost = booking.toalCost ?? 0
          const value = isCancelled ? cancellationFee : toalCost

          return (
            <span className="font-mono text-sm font-bold text-foreground">
              £{value.toFixed(2)}
            </span>
          )
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const booking = row.original
          const status = booking.status
          const isPast = new Date(booking.endTime) < new Date()
          const isEmergency = booking.useCategory === 'emergency_recovery'

          if (
            status === 'APPROVED' &&
            isEmergency &&
            isPast &&
            booking.paymentStatus === 'pending'
          ) {
            return (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1.5 cursor-help text-[9px] font-bold h-5 uppercase tracking-widest">
                    <AlertTriangle className="h-3 w-3" />
                    Awaiting Confirmation
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-50">
                  The flight window has closed. The operator must confirm if
                  they utilized your site before payment is released.
                </TooltipContent>
              </Tooltip>
            )
          }

          return (
            <Badge
              className={cn(
                'text-[9px] uppercase tracking-widest border-none font-bold h-5 px-2',
                status === 'PENDING'
                  ? 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                  : status === 'APPROVED'
                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                    : status === 'REJECTED'
                      ? 'bg-red-100 text-red-700 hover:bg-red-100'
                      : 'bg-muted text-muted-foreground hover:bg-muted',
              )}
            >
              {status}
            </Badge>
          )
        },
      },
      {
        id: 'actions',
        header: 'Action',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {onViewTimeline && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/5"
                    onClick={() => onViewTimeline(row.original)}
                  >
                    <History className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View Timeline</TooltipContent>
              </Tooltip>
            )}
            {showReviewButton && row.original.status === 'PENDING' ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    className="h-8 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-[10px] uppercase tracking-wider px-3 shadow-sm"
                    onClick={() => onReview(row.original)}
                  >
                    Review Request
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Review Request</TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/5"
                    onClick={() => onReview(row.original)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View Details</TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                  asChild
                >
                  <Link
                    href={`/dashboard/assetowner/incident-report/new?bookingId=${row.original.id}&siteId=${row.original.siteId}`}
                  >
                    <AlertTriangle className="h-4 w-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Report Incident</TooltipContent>
            </Tooltip>
          </div>
        ),
      },
    ],
    [onReview, onViewTimeline, showReviewButton],
  )

  return (
    <TooltipProvider>
      <DataTable
        columns={columns}
        data={data}
        totalRows={resolvedTotalRows}
        totalPages={resolvedTotalPages}
        pagination={resolvedPagination}
        onPaginationChange={handlePaginationChange}
        isLoading={isLoading}
      />
    </TooltipProvider>
  )
}
