export type StripeState = 'unconnected' | 'action_required' | 'connected'

export interface BalanceOverview {
  availableBalance: number
  pendingBalance: number
  lifetimeEarnings: number
  currency: string
  stripeConnected: boolean
}

export type WithdrawalStatus = 'pending' | 'available' | 'paid_out'

export interface WithdrawalLedgerRow {
  id: string
  date: string
  amount: number
  status: WithdrawalStatus
  payoutId: string | null
  completedAt: string | null
}
