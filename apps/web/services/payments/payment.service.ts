import { apiClient } from '../api-client'
import type {
  CreateWithdrawalResponse,
  LandownerBalanceData,
  StripeConnectResponse,
  WithdrawalSummary,
} from './payment.types'

class PaymentService {
  private readonly BASE_PATH = '/payments/v1'

  private getStoredToken(): string | undefined {
    if (typeof window === 'undefined') return undefined

    const storageKeys = [
      'accessToken',
      'idToken',
      'vertiaccess_access_token',
      'vertiaccess_id_token',
    ]

    for (const key of storageKeys) {
      const value = window.localStorage.getItem(key)
      if (value) return value
    }

    return undefined
  }

  async getLandownerBalance(token?: string): Promise<LandownerBalanceData> {
    const response = await apiClient.get<{ data: LandownerBalanceData }>(
      `${this.BASE_PATH}/landowner/balance`,
      {
        token: token ?? this.getStoredToken(),
      },
    )

    return response.data
  }

  async listWithdrawals(token?: string): Promise<WithdrawalSummary[]> {
    const response = await apiClient.get<{ data: WithdrawalSummary[] }>(
      `${this.BASE_PATH}/landowner/withdrawals`,
      {
        token: token ?? this.getStoredToken(),
      },
    )

    return response.data
  }

  async connectStripeAccount(
    country = 'GB',
    token?: string,
  ): Promise<StripeConnectResponse> {
    const response = await apiClient.post<{ data: StripeConnectResponse }>(
      `${this.BASE_PATH}/landowner/stripe-connect`,
      { country },
      {
        token: token ?? this.getStoredToken(),
      },
    )

    return response.data
  }

  async createWithdrawalRequest(
    amount: number,
    token?: string,
  ): Promise<CreateWithdrawalResponse> {
    const response = await apiClient.post<{ data: CreateWithdrawalResponse }>(
      `${this.BASE_PATH}/landowner/withdrawals`,
      { amount },
      {
        token: token ?? this.getStoredToken(),
      },
    )

    return response.data
  }
}

export const paymentService = new PaymentService()
