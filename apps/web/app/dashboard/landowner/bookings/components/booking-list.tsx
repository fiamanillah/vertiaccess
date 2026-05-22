'use client'

import * as React from 'react'
import { DataTable } from '@/components/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@workspace/ui/components/badge'
import { Button } from '@workspace/ui/components/button'
import { Calendar, Clock, MapPin, User, Eye, ArrowRight } from 'lucide-react'
import { Booking } from '../types'
import { cn } from '@workspace/ui/lib/utils'
import { format } from 'date-fns'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip'
import { Zap, AlertTriangle } from 'lucide-react'

interface BookingListProps {
  data: Booking[]
  isLoading: boolean
  onReview: (booking: Booking) => void
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
        accessorKey: 'operatorName',
        header: 'Operator & Mission',
        cell: ({ row }) => (
          <div className="flex flex-col gap-1 py-1">
            <div className="flex items-center gap-2">
              {row.original.isAutoApproved && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-emerald-500/10 p-0.5 rounded cursor-help">
                      <Zap className="h-3 w-3 text-emerald-600 fill-current" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Auto-Approved</TooltipContent>
                </Tooltip>
              )}
              <span className="font-bold text-sm text-foreground tracking-tight">
                {row.original.operatorName}
              </span>
              <Badge
                variant="outline"
                className="text-[9px] uppercase tracking-widest h-4 px-1 font-bold bg-muted/50 border-none text-muted-foreground"
              >
                {row.original.operatorOrganisation || 'Independent'}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="truncate max-w-[150px] italic">
                "{row.original.missionIntent}"
              </span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'siteName',
        header: 'Location',
        cell: ({ row }) => {
          const isEmergency = row.original.useCategory === 'emergency_recovery'
          return (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                <MapPin className="h-3 w-3 shrink-0 text-primary/60" />
                <span className="truncate max-w-[180px]">
                  {row.original.siteName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isEmergency ? (
                  <div className="flex flex-col gap-0.5">
                    <Badge className="bg-amber-100 text-amber-700 border-none text-[8px] font-black tracking-widest h-4 px-1.5 uppercase">
                      Emergency Standby
                    </Badge>
                    <span className="text-[7px] text-amber-600/70 font-bold uppercase tracking-tighter ml-0.5">
                      Paid only if used
                    </span>
                  </div>
                ) : (
                  <Badge className="bg-indigo-100 text-indigo-700 border-none text-[8px] font-black tracking-widest h-4 px-1.5 uppercase">
                    Planned TOAL
                  </Badge>
                )}
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: 'startTime',
        header: 'Scheduled Date/Time',
        cell: ({ row }) => {
          const date = new Date(row.original.startTime)
          return (
            <div className="flex flex-col gap-1 font-mono">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                {format(date, 'dd MMM yyyy')}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                {format(date, 'HH:mm')}
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: 'toalCost',
        header: 'Revenue',
        cell: ({ row }) => {
          const booking = row.original
          const isEmergency = booking.useCategory === 'emergency_recovery'
          const isCancelled = booking.status === 'CANCELLED'
          const hasFee = booking.cancellationFee && booking.cancellationFee > 0

          return (
            <div className="flex flex-col items-start gap-0.5">
              {isCancelled ? (
                <div className="flex flex-col gap-0.5">
                  <span
                    className={cn(
                      'text-sm font-bold font-mono',
                      hasFee ? 'text-emerald-600' : 'text-muted-foreground',
                    )}
                  >
                    £{hasFee ? booking.cancellationFee?.toFixed(2) : '0.00'}
                  </span>
                  <span className="text-[8px] uppercase font-black tracking-tighter">
                    {hasFee ? 'Fee Collected' : 'No Charge'}
                  </span>
                </div>
              ) : (
                <>
                  <div className="flex items-baseline gap-0.5 font-mono">
                    <span className="text-[10px] text-muted-foreground">£</span>
                    <span className="text-sm font-bold text-foreground">
                      {booking.toalCost?.toFixed(2)}
                    </span>
                  </div>
                  <span className="text-[8px] text-muted-foreground uppercase font-black tracking-tighter">
                    {isEmergency ? 'Potential' : 'Gross'}
                  </span>
                </>
              )}
            </div>
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
                <TooltipContent className="max-w-[200px]">
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
        header: () => <div className="text-right">Action</div>,
        cell: ({ row }) => (
          <div className="text-right">
            {showReviewButton && row.original.status === 'PENDING' ? (
              <Button
                size="sm"
                className="h-8 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-[10px] uppercase tracking-wider px-3 shadow-sm"
                onClick={() => onReview(row.original)}
              >
                Review Request
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary hover:bg-primary/5 px-3"
                onClick={() => onReview(row.original)}
              >
                <Eye className="h-3.5 w-3.5" />
                Details
              </Button>
            )}
          </div>
        ),
      },
    ],
    [onReview, showReviewButton],
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
