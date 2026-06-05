'use client'

import type { ReactNode } from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip'
import { Badge } from '@workspace/ui/components/badge'
import { Button } from '@workspace/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'
import { CircleHelp, Wallet, Clock3, ChartNoAxesCombined } from 'lucide-react'
import { cn } from '@workspace/ui/lib/utils'
import type { BalanceOverview } from './balance-types'

interface FinancialOverviewProps {
  balance: BalanceOverview
  canWithdraw: boolean
  onWithdraw: () => void
}

function MetricCard({
  title,
  value,
  description,
  highlight = false,
  action,
}: {
  title: string
  value: string
  description: string
  highlight?: boolean
  action?: ReactNode
}) {
  return (
    <Card
      className={cn(
        'shadow-sm',
        highlight && 'border-primary/30 ring-1 ring-primary/10',
      )}
    >
      <CardHeader className="space-y-2 pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">
            {title}
          </CardTitle>
          {highlight ? <Wallet className="h-4 w-4 text-primary" /> : null}
        </div>
        <div className="text-3xl font-black tracking-tight text-foreground">
          {value}
        </div>
        <CardDescription className="text-xs font-medium leading-relaxed text-muted-foreground">
          {description}
        </CardDescription>
      </CardHeader>
      {action ? <CardContent className="pt-0">{action}</CardContent> : null}
    </Card>
  )
}

export function FinancialOverview({
  balance,
  canWithdraw,
  onWithdraw,
}: FinancialOverviewProps) {
  return (
    <TooltipProvider>
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Available to Withdraw"
          value={`£${balance.availableBalance.toFixed(2)}`}
          description="Cleared funds ready for payout to your connected account."
          highlight
          action={
            <Button
              className="w-full"
              onClick={onWithdraw}
              disabled={!canWithdraw}
            >
              Withdraw Funds
            </Button>
          }
        />

        <MetricCard
          title="Pending Clearance"
          value={`£${balance.pendingBalance.toFixed(2)}`}
          description="Funds from completed flights that are still clearing through Stripe."
          action={
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-2"
                >
                  <Badge variant="secondary" className="gap-1.5">
                    <Clock3 className="h-3 w-3" />
                    Clearance Window
                  </Badge>
                  <CircleHelp className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                Funds automatically clear 3-5 days after a successful flight.
              </TooltipContent>
            </Tooltip>
          }
        />

        <MetricCard
          title="Lifetime Earnings"
          value={`£${balance.lifetimeEarnings.toFixed(2)}`}
          description="Your total earnings on VertiAccess across all completed payouts."
          action={
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              <ChartNoAxesCombined className="h-3.5 w-3.5" />
              Lifetime performance
            </div>
          }
        />
      </div>
    </TooltipProvider>
  )
}
