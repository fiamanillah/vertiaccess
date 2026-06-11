'use client'

import { Badge } from '@workspace/ui/components/badge'
import { Button } from '@workspace/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'
import {
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  Landmark,
  ShieldCheck,
  CircleHelp,
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip'
import type { StripeState } from './balance-types'

interface StripeConnectCardProps {
  state: StripeState
  bankLabel?: string
  onPrimaryAction: () => void
  onSecondaryAction?: () => void
  isLoading?: boolean
  isDataLoading?: boolean
}

export function StripeConnectCard({
  state,
  bankLabel = 'Barclays ****5678',
  onPrimaryAction,
  onSecondaryAction,
  isLoading,
  isDataLoading,
}: StripeConnectCardProps) {
  if (isDataLoading) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-2 w-full">
            <div className="h-5 w-24 bg-muted animate-pulse rounded-full" />
            <div className="h-4 w-48 bg-muted animate-pulse rounded" />
            <div className="h-3 w-64 bg-muted animate-pulse rounded" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-10 w-40 bg-muted animate-pulse rounded-md" />
        </CardContent>
      </Card>
    )
  }

  if (state === 'action_required') {
    return (
      <TooltipProvider>
        <Card className="border-amber-200 bg-amber-50/40 shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div className="space-y-2">
              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 font-semibold text-xs border-amber-200/50">
                <AlertTriangle className="mr-1.5 h-3 w-3" />
                Action Required
              </Badge>
              <CardTitle className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                <span>Verify your Stripe account</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="rounded-full p-0.5 text-muted-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
                      aria-label="About Stripe verification"
                    >
                      <CircleHelp className="h-4 w-4 text-amber-800/80 dark:text-amber-200/80" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs font-normal normal-case tracking-normal">
                    Stripe requires additional information such as a photo ID to
                    verify your identity and prevent fraud.
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Button
              onClick={onPrimaryAction}
              disabled={isLoading}
              className="gap-2"
            >
              Complete Verification
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </TooltipProvider>
    )
  }

  if (state === 'connected') {
    return (
      <TooltipProvider>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div className="space-y-2">
              <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 font-semibold text-xs border-emerald-200/50">
                <BadgeCheck className="mr-1.5 h-3 w-3" />
                Active
              </Badge>
              <CardTitle className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                <span>Stripe Connect is active</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="rounded-full p-0.5 text-muted-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
                      aria-label="About Stripe status"
                    >
                      <CircleHelp className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs font-normal normal-case tracking-normal">
                    Payouts routed to: <span className="font-bold">{bankLabel}</span>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </div>
            <div className="rounded-full border bg-muted/50 px-3 py-1 text-xs font-semibold text-muted-foreground/60">
              Secure direct deposit
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <Button
              onClick={onSecondaryAction ?? onPrimaryAction}
              disabled={isLoading}
              className="gap-2"
            >
              Update Bank Details
              <ArrowUpRight className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground/50">
              <ShieldCheck className="h-3.5 w-3.5" />
              Managed by Stripe Express
            </div>
          </CardContent>
        </Card>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider>
      <Card className="border-dashed shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground/60 border">
              <Landmark className="h-3 w-3" />
              Powered by Stripe
            </div>
            <CardTitle className="flex items-center gap-1.5 text-sm font-bold text-foreground">
              <span>Connect your bank to receive payouts</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="rounded-full p-0.5 text-muted-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
                    aria-label="About Stripe connection"
                  >
                    <CircleHelp className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs font-normal normal-case tracking-normal">
                  VertiAccess partners with Stripe for secure, encrypted direct
                  deposits. You will be redirected to Stripe to complete onboarding.
                </TooltipContent>
              </Tooltip>
            </CardTitle>
          </div>
          <div className="hidden rounded-full border bg-background px-3 py-1 text-xs font-semibold text-muted-foreground/50 md:inline-flex">
            Trusted payout flow
          </div>
        </CardHeader>
        <CardContent>
          <Button
            onClick={onPrimaryAction}
            disabled={isLoading}
            className="gap-2"
          >
            Connect with Stripe
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
