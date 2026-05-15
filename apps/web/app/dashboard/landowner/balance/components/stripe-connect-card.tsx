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
} from 'lucide-react'
import type { StripeState } from './balance-types'

interface StripeConnectCardProps {
  state: StripeState
  bankLabel?: string
  onPrimaryAction: () => void
  onSecondaryAction?: () => void
  isLoading?: boolean
}

export function StripeConnectCard({
  state,
  bankLabel = 'Barclays ****5678',
  onPrimaryAction,
  onSecondaryAction,
  isLoading,
}: StripeConnectCardProps) {
  if (state === 'action_required') {
    return (
      <Card className="border-amber-200 bg-amber-50/40 shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-2">
            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
              <AlertTriangle className="mr-1 h-3.5 w-3.5" />
              Action Required
            </Badge>
            <CardTitle className="text-base font-semibold">
              Verify your Stripe account
            </CardTitle>
            <CardDescription className="max-w-2xl text-sm text-muted-foreground">
              Stripe requires additional information such as a photo ID to
              verify your identity and prevent fraud.
            </CardDescription>
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
    )
  }

  if (state === 'connected') {
    return (
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-2">
            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
              <BadgeCheck className="mr-1 h-3.5 w-3.5" />
              Active
            </Badge>
            <CardTitle className="text-base font-semibold">
              Stripe Connect is active
            </CardTitle>
            <CardDescription className="max-w-2xl text-sm text-muted-foreground">
              Payouts routed to: {bankLabel}
            </CardDescription>
          </div>
          <div className="rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
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
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4" />
            Managed by Stripe Express
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-dashed shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            <Landmark className="h-3.5 w-3.5" />
            Powered by Stripe
          </div>
          <CardTitle className="text-base font-semibold">
            Connect your bank account to receive payouts
          </CardTitle>
          <CardDescription className="max-w-2xl text-sm text-muted-foreground">
            VertiAccess partners with Stripe for secure, encrypted direct
            deposits. You will be redirected to Stripe to complete onboarding.
          </CardDescription>
        </div>
        <div className="hidden rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground md:inline-flex">
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
  )
}
