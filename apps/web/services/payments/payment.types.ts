export type StripeConnectState = 'unconnected' | 'action_required' | 'connected'

export type LedgerTransactionType =
  | 'planned_toal'
  | 'emergency_standby'
  | 'cancellation_fee'

export type LedgerTransactionStatus = 'pending' | 'available' | 'paid_out'

export interface LandownerBalanceData {
  availableBalance: number
  pendingBalance: number
  withdrawnBalance: number
  totalEarned: number
  currency: string
  lastCalculatedAt: string
  stripeConnected: boolean
}

export interface WithdrawalSummary {
  id: string
  amount: number
  currency: string
  status: string
  requestedAt: string
  completedAt?: string | null
  stripePayoutId?: string | null
}

export interface StripeConnectResponse {
  accountId: string
  onboardingUrl: string
}

export interface CreateWithdrawalResponse {
  id: string
  amount: number
  status: string
  stripePayoutId: string
  requestedAt: string
}
