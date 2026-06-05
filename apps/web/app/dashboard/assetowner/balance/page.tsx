'use client'

import * as React from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@workspace/ui/components/alert'
import { Badge } from '@workspace/ui/components/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { AlertTriangle, RefreshCcw } from 'lucide-react'
import { FinancialOverview } from './components/financial-overview'
import { EarningsLedger } from './components/earnings-ledger'
import { StripeConnectCard } from './components/stripe-connect-card'
import { WithdrawalDrawer } from './components/withdrawal-drawer'
import type {
  BalanceOverview,
  WithdrawalLedgerRow,
  StripeState,
} from './components/balance-types'
import { paymentService } from '@/services/payments/payment.service'

function getEmptyBalance(): BalanceOverview {
  return {
    availableBalance: 0,
    pendingBalance: 0,
    lifetimeEarnings: 0,
    currency: 'GBP',
    stripeConnected: false,
  }
}

export default function Page() {
  const searchParams = useSearchParams()
  const previewStripeState = searchParams.get(
    'stripe_state',
  ) as StripeState | null

  const [balance, setBalance] = React.useState<BalanceOverview | null>(null)
  const [stripeState, setStripeState] =
    React.useState<StripeState>('unconnected')
  const [transactions, setTransactions] = React.useState<WithdrawalLedgerRow[]>(
    [],
  )
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSyncing, setIsSyncing] = React.useState(false)
  const [isWithdrawOpen, setIsWithdrawOpen] = React.useState(false)
  const [isWithdrawing, setIsWithdrawing] = React.useState(false)

  const derivedBalance = balance ?? getEmptyBalance()
  const canWithdraw =
    derivedBalance.availableBalance > 0 && stripeState === 'connected'
  const bankLabel =
    stripeState === 'connected' ? 'Barclays ****5678' : 'No bank connected'

  React.useEffect(() => {
    async function loadData() {
      setIsLoading(true)

      try {
        const [balanceResponse, withdrawalResponse] = await Promise.all([
          paymentService.getAssetOwnerBalance(),
          paymentService.listWithdrawals(),
        ])

        const nextBalance: BalanceOverview = {
          availableBalance: Number(balanceResponse.availableBalance),
          pendingBalance: Number(balanceResponse.pendingBalance),
          lifetimeEarnings: Number(balanceResponse.totalEarned),
          currency: balanceResponse.currency,
          stripeConnected: balanceResponse.stripeConnected,
        }

        setBalance(nextBalance)
        setTransactions(
          withdrawalResponse.map((withdrawal) => ({
            id: withdrawal.id,
            date: withdrawal.requestedAt,
            amount: Number(withdrawal.amount),
            status:
              withdrawal.status === 'COMPLETED'
                ? 'paid_out'
                : withdrawal.status === 'IN_PROGRESS'
                  ? 'pending'
                  : 'available',
            payoutId: withdrawal.stripePayoutId ?? null,
            completedAt: withdrawal.completedAt ?? null,
          })),
        )
        setStripeState(
          previewStripeState ??
          (nextBalance.stripeConnected ? 'connected' : 'unconnected'),
        )
      } catch (error) {
        console.error(error)
        setBalance(getEmptyBalance())
        setTransactions([])
        setStripeState(previewStripeState ?? 'unconnected')
        toast.error('Unable to fetch your balance data.')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [previewStripeState])

  const handleStripePrimaryAction = React.useCallback(async () => {
    setIsSyncing(true)

    try {
      const response = await paymentService.connectStripeAccount('GB')
      if (response.onboardingUrl) {
        window.location.assign(response.onboardingUrl)
        return
      }

      if (stripeState === 'connected') {
        toast.info('Opening Stripe Express dashboard preview.')
      } else {
        toast.info('Redirecting to Stripe onboarding preview.')
        setStripeState('connected')
      }
    } catch (error) {
      console.error(error)
      toast.error('Unable to start the Stripe flow right now.')
    } finally {
      setIsSyncing(false)
    }
  }, [stripeState])

  const handleStripeSecondaryAction = React.useCallback(async () => {
    setIsSyncing(true)

    try {
      const response = await paymentService.connectStripeAccount('GB')
      if (response.onboardingUrl) {
        window.location.assign(response.onboardingUrl)
        return
      }

      toast.info('Opening Stripe Express dashboard preview.')
    } catch (error) {
      console.error(error)
      toast.error('Unable to open Stripe dashboard right now.')
    } finally {
      setIsSyncing(false)
    }
  }, [])

  const handleWithdrawConfirm = React.useCallback(async () => {
    if (!derivedBalance.availableBalance) return

    setIsWithdrawing(true)

    try {
      await paymentService.createWithdrawalRequest(
        derivedBalance.availableBalance,
      )

      setBalance((current) =>
        current
          ? {
            ...current,
            pendingBalance: current.pendingBalance + current.availableBalance,
            availableBalance: 0,
          }
          : current,
      )

      setIsWithdrawOpen(false)
      toast.success(
        `£${derivedBalance.availableBalance.toFixed(2)} is on its way to your bank account.`,
      )
    } catch (error) {
      console.error(error)
      toast.error('Unable to create the withdrawal right now.')
    } finally {
      setIsWithdrawing(false)
    }
  }, [derivedBalance.availableBalance])

  const activeStripeState = previewStripeState ?? stripeState

  return (
    <div className="flex flex-1 flex-col gap-6 pb-10 max-w-7xl mx-auto p-4">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Earnings &amp; payouts
          </h1>
          <Badge
            variant="secondary"
            className="hidden md:inline-flex font-semibold text-xs"
          >
            Asset Owner
          </Badge>
        </div>
        <p className="max-w-3xl text-sm text-muted-foreground font-medium">
          Review your cleared funds, manage Stripe Connect, and see exactly
          which flights generated each payout.
        </p>
      </div>

      {previewStripeState === 'action_required' ? (
        <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertTitle className="font-bold">Verification preview enabled</AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            Use this state preview to inspect the Stripe verification flow
            without changing the backend connection.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground/80">
            Financial overview
          </CardTitle>
          <CardDescription className="text-xs font-medium">
            Track the money that is ready, pending, and already earned on
            VertiAccess.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-lg border p-4">
                  <Skeleton className="mb-3 h-4 w-32" />
                  <Skeleton className="mb-2 h-10 w-40" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <FinancialOverview
              balance={derivedBalance}
              canWithdraw={canWithdraw}
              onWithdraw={() => setIsWithdrawOpen(true)}
            />
          )}
        </CardContent>
      </Card>

      <StripeConnectCard
        state={activeStripeState}
        bankLabel={bankLabel}
        onPrimaryAction={handleStripePrimaryAction}
        onSecondaryAction={handleStripeSecondaryAction}
        isLoading={isSyncing}
        isDataLoading={isLoading}
      />

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-sm font-semibold text-muted-foreground/80">
              Payout notes
            </CardTitle>
            <CardDescription>
              Withdrawals are processed from your connected Stripe balance to
              your external bank.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCcw className="h-4 w-4" />
            Updated on demand
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border bg-muted/20 p-4">
            <div className="text-xs font-semibold text-muted-foreground">
              Withdrawable
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight">
              £{derivedBalance.availableBalance.toFixed(2)}
            </div>
          </div>
          <div className="rounded-lg border bg-muted/20 p-4">
            <div className="text-xs font-semibold text-muted-foreground">
              Settlement
            </div>
            <div className="mt-2 text-sm text-muted-foreground font-medium">
              Funds automatically clear 3-5 days after a successful flight.
            </div>
          </div>
          <div className="rounded-lg border bg-muted/20 p-4">
            <div className="text-xs font-semibold text-muted-foreground">
              Destination
            </div>
            <div className="mt-2 text-sm text-muted-foreground font-bold">
              {bankLabel}
            </div>
          </div>
        </CardContent>
      </Card>

      <EarningsLedger transactions={transactions} isLoading={isLoading} />

      <WithdrawalDrawer
        open={isWithdrawOpen}
        amount={derivedBalance.availableBalance}
        bankLabel={bankLabel}
        onOpenChange={setIsWithdrawOpen}
        onConfirm={handleWithdrawConfirm}
        isSubmitting={isWithdrawing}
      />
    </div>
  )
}
