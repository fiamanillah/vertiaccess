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
  RevenueLedgerRow,
  StripeState,
} from './components/balance-types'
import { paymentService } from '@/services/payments/payment.service'

const MOCK_LEDGER: RevenueLedgerRow[] = [
  {
    id: 'tx-1001',
    date: new Date(Date.now() - 86400000).toISOString(),
    siteName: 'North Field Estate',
    operatorName: 'Falcon Survey Ltd',
    type: 'planned_toal',
    amount: 45,
    status: 'available',
  },
  {
    id: 'tx-1002',
    date: new Date(Date.now() - 172800000).toISOString(),
    siteName: 'Riverbank Meadow',
    operatorName: 'SkyGrid Aviation',
    type: 'emergency_standby',
    amount: 62.5,
    status: 'pending',
  },
  {
    id: 'tx-1003',
    date: new Date(Date.now() - 259200000).toISOString(),
    siteName: 'Canary Wharf Helipad',
    operatorName: 'Falcon Survey Ltd',
    type: 'cancellation_fee',
    amount: 15,
    status: 'paid_out',
  },
  {
    id: 'tx-1004',
    date: new Date(Date.now() - 345600000).toISOString(),
    siteName: 'North Field Estate',
    operatorName: 'SkyLine Drone Services',
    type: 'planned_toal',
    amount: 90,
    status: 'available',
  },
  {
    id: 'tx-1005',
    date: new Date(Date.now() - 432000000).toISOString(),
    siteName: 'South Ridge Works',
    operatorName: 'SkyLine Drone Services',
    type: 'emergency_standby',
    amount: 37.5,
    status: 'pending',
  },
]

function getFallbackBalance(): BalanceOverview {
  return {
    availableBalance: 450,
    pendingBalance: 150,
    lifetimeEarnings: 1200,
    currency: 'GBP',
    stripeConnected: false,
  }
}

function hasStoredToken() {
  if (typeof window === 'undefined') return false
  return Boolean(
    window.localStorage.getItem('accessToken') ||
    window.localStorage.getItem('idToken'),
  )
}

export default function Page() {
  const searchParams = useSearchParams()
  const previewStripeState = searchParams.get(
    'stripe_state',
  ) as StripeState | null

  const [balance, setBalance] = React.useState<BalanceOverview | null>(null)
  const [stripeState, setStripeState] =
    React.useState<StripeState>('unconnected')
  const [transactions] = React.useState<RevenueLedgerRow[]>(MOCK_LEDGER)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSyncing, setIsSyncing] = React.useState(false)
  const [isWithdrawOpen, setIsWithdrawOpen] = React.useState(false)
  const [isWithdrawing, setIsWithdrawing] = React.useState(false)

  const derivedBalance = balance ?? getFallbackBalance()
  const canWithdraw =
    derivedBalance.availableBalance > 0 && stripeState === 'connected'
  const bankLabel =
    stripeState === 'connected' ? 'Barclays ****5678' : 'No bank connected'

  React.useEffect(() => {
    async function loadData() {
      setIsLoading(true)

      try {
        if (hasStoredToken()) {
          const balanceResponse = await paymentService.getLandownerBalance()

          const nextBalance: BalanceOverview = {
            availableBalance: Number(balanceResponse.availableBalance),
            pendingBalance: Number(balanceResponse.pendingBalance),
            lifetimeEarnings: Number(balanceResponse.totalEarned),
            currency: balanceResponse.currency,
            stripeConnected: balanceResponse.stripeConnected,
          }

          setBalance(nextBalance)
          setStripeState(
            previewStripeState ??
              (nextBalance.stripeConnected ? 'connected' : 'unconnected'),
          )
          return
        }

        const fallback = getFallbackBalance()
        setBalance(fallback)
        setStripeState(previewStripeState ?? 'connected')
      } catch (error) {
        console.error(error)
        setBalance(getFallbackBalance())
        setStripeState(previewStripeState ?? 'connected')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [previewStripeState])

  const handleStripePrimaryAction = React.useCallback(async () => {
    setIsSyncing(true)

    try {
      if (hasStoredToken()) {
        const response = await paymentService.connectStripeAccount('GB')
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
      if (hasStoredToken()) {
        const response = await paymentService.connectStripeAccount('GB')
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
      if (hasStoredToken()) {
        await paymentService.createWithdrawalRequest(
          derivedBalance.availableBalance,
        )
      }

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
    <div className="flex flex-1 flex-col gap-6 pb-10 max-w-7xl mx-auto">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Earnings &amp; Payouts
          </h1>
          <Badge variant="secondary" className="hidden md:inline-flex">
            Landowner
          </Badge>
        </div>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Review your cleared funds, manage Stripe Connect, and see exactly
          which flights generated each payout.
        </p>
      </div>

      {previewStripeState === 'action_required' ? (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Verification preview enabled</AlertTitle>
          <AlertDescription>
            Use this state preview to inspect the Stripe verification flow
            without changing the backend connection.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Financial overview
          </CardTitle>
          <CardDescription>
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
      />

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold">
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
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Withdrawable
            </div>
            <div className="mt-2 text-2xl font-semibold">
              £{derivedBalance.availableBalance.toFixed(2)}
            </div>
          </div>
          <div className="rounded-lg border bg-muted/20 p-4">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Settlement
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              Funds automatically clear 3-5 days after a successful flight.
            </div>
          </div>
          <div className="rounded-lg border bg-muted/20 p-4">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Destination
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              {bankLabel}
            </div>
          </div>
        </CardContent>
      </Card>

      <EarningsLedger transactions={transactions} />

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
