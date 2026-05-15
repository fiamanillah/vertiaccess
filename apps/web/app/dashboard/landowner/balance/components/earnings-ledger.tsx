'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@workspace/ui/components/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'
import { DataTable } from '@/components/data-table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip'
import { cn } from '@workspace/ui/lib/utils'
import type {
  RevenueLedgerRow,
  RevenueStatus,
  RevenueType,
} from './balance-types'

interface EarningsLedgerProps {
  transactions: RevenueLedgerRow[]
}

const typeLabels: Record<RevenueType, string> = {
  planned_toal: 'Planned TOAL',
  emergency_standby: 'Emergency Standby',
  cancellation_fee: 'Cancellation Fee',
}

const typeTone: Record<RevenueType, string> = {
  planned_toal: 'bg-indigo-100 text-indigo-700',
  emergency_standby: 'bg-amber-100 text-amber-700',
  cancellation_fee: 'bg-emerald-100 text-emerald-700',
}

const statusTone: Record<RevenueStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  available: 'bg-emerald-100 text-emerald-700',
  paid_out: 'bg-zinc-200 text-zinc-700',
}

export function EarningsLedger({ transactions }: EarningsLedgerProps) {
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 5,
  })

  const columns = React.useMemo<ColumnDef<RevenueLedgerRow>[]>(
    () => [
      {
        accessorKey: 'date',
        header: 'Date',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-sm font-bold text-foreground tracking-tight">
              {format(new Date(row.original.date), 'dd MMM yyyy')}
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
              {format(new Date(row.original.date), 'HH:mm')}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <span className="text-sm font-black tracking-tight text-foreground">
              {row.original.siteName}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              {row.original.operatorName}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => (
          <Badge
            className={cn(
              'border-none text-[10px] font-semibold uppercase tracking-widest',
              typeTone[row.original.type],
            )}
          >
            {typeLabels[row.original.type]}
          </Badge>
        ),
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ row }) => (
          <div className="font-black text-sm tracking-tight text-foreground">
            + £{row.original.amount.toFixed(2)}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  className={cn(
                    'border-none text-[10px] font-semibold uppercase tracking-widest',
                    statusTone[row.original.status],
                  )}
                >
                  {row.original.status.replace('_', ' ')}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                {row.original.status === 'pending'
                  ? 'Flight happened, waiting for Stripe.'
                  : row.original.status === 'available'
                    ? 'Ready to withdraw.'
                    : 'Already sent to their bank.'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ),
      },
    ],
    [],
  )

  const totalPages = Math.max(
    1,
    Math.ceil(transactions.length / pagination.pageSize),
  )
  const visibleTransactions = React.useMemo(
    () =>
      transactions.slice(
        pagination.pageIndex * pagination.pageSize,
        (pagination.pageIndex + 1) * pagination.pageSize,
      ),
    [pagination.pageIndex, pagination.pageSize, transactions],
  )

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground/70">
          Earnings Ledger
        </CardTitle>
        <CardDescription className="text-xs font-medium">
          Track exactly which flight generated each payout and where it is in
          the payout flow.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={visibleTransactions}
          totalRows={transactions.length}
          totalPages={totalPages}
          pagination={pagination}
          onPaginationChange={setPagination}
          isLoading={false}
        />
      </CardContent>
    </Card>
  )
}
