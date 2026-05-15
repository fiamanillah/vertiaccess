export type StripeState = 'unconnected' | 'action_required' | 'connected'

export interface BalanceOverview {
  availableBalance: number
  pendingBalance: number
  lifetimeEarnings: number
  currency: string
  stripeConnected: boolean
}

export type RevenueType =
  | 'planned_toal'
  | 'emergency_standby'
  | 'cancellation_fee'

export type RevenueStatus = 'pending' | 'available' | 'paid_out'

export interface RevenueLedgerRow {
  id: string
  date: string
  siteName: string
  operatorName: string
  type: RevenueType
  amount: number
  status: RevenueStatus
}
