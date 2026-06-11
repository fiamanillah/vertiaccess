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
import { CircleHelp } from 'lucide-react'
import type { WithdrawalLedgerRow, WithdrawalStatus } from './balance-types'

interface EarningsLedgerProps {
  transactions: WithdrawalLedgerRow[]
  isLoading?: boolean
}

const statusTone: Record<WithdrawalStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  available: 'bg-emerald-100 text-emerald-700',
  paid_out: 'bg-zinc-200 text-zinc-700',
}

export function EarningsLedger({ transactions, isLoading }: EarningsLedgerProps) {
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 5,
  })

  const columns = React.useMemo<ColumnDef<WithdrawalLedgerRow>[]>(
    () => [
      {
        accessorKey: 'date',
        header: 'Date',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-sm font-bold text-foreground tracking-tight">
              {format(new Date(row.original.date), 'dd MMM yyyy')}
            </span>
            <span className="text-xs font-semibold text-muted-foreground/50">
              {format(new Date(row.original.date), 'HH:mm')}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'payoutId',
        header: 'Payout',
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <span className="text-sm font-black tracking-tight text-foreground">
              Stripe withdrawal
            </span>
            <span className="text-xs font-semibold text-muted-foreground/60">
              {row.original.payoutId ?? 'Pending payout reference'}
            </span>
          </div>
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
                    'border-none text-xs font-semibold capitalize',
                    statusTone[row.original.status],
                  )}
                >
                  {row.original.status.replace('_', ' ')}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                {row.original.status === 'pending'
                  ? 'Withdrawal is being prepared in Stripe.'
                  : row.original.status === 'available'
                    ? 'Ready to withdraw.'
                    : 'Already sent to your bank.'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ),
      },
      {
        accessorKey: 'completedAt',
        header: 'Completed',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.completedAt
              ? format(new Date(row.original.completedAt), 'dd MMM yyyy')
              : '—'}
          </span>
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
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground/70">
          <span>Withdrawal History</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="rounded-full p-0.5 text-muted-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
                  aria-label="About withdrawal history"
                >
                  <CircleHelp className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs font-normal normal-case tracking-normal">
                Track each Stripe withdrawal request and where it is in the payout
                flow.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={visibleTransactions}
          totalRows={transactions.length}
          totalPages={totalPages}
          pagination={pagination}
          onPaginationChange={setPagination}
          isLoading={isLoading}
        />
      </CardContent>
    </Card>
  )
}
