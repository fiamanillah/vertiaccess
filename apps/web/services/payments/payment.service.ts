import { apiClient } from '../api-client'
import type {
  CreateWithdrawalResponse,
  LandownerBalanceData,
  StripeConnectResponse,
  WithdrawalSummary,
  Transaction,
  TransactionListResponse,
} from './payment.types'

export interface PaymentMethod {
  id: string
  stripePaymentMethodId: string
  brand: string
  last4: string
  expiryMonth: number
  expiryYear: number
  isDefault: boolean
}

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

  /**
   * GET /billing/v1/payment-methods
   * Returns all saved cards for the authenticated operator.
   */
  async getPaymentMethods(token?: string): Promise<PaymentMethod[]> {
    const response = await apiClient.get<{ data: PaymentMethod[] }>(
      `${this.BASE_PATH}/payment-methods`,
      {
        token: token ?? this.getStoredToken(),
      },
    )
    return response.data
  }

  /**
   * POST /billing/v1/payment-methods/retry-overdue
   * Retries a failed emergency charge after the operator has updated their card.
   * On success, their account is unlocked (PAYMENT_LOCKED → VERIFIED).
   */
  async retryOverduePayment(token?: string): Promise<{ status: 'unlocked' }> {
    const response = await apiClient.post<{ data: { status: 'unlocked' } }>(
      `${this.BASE_PATH}/payment-methods/retry-overdue`,
      {},
      {
        token: token ?? this.getStoredToken(),
      },
    )
    return response.data
  }

  /**
   * GET /payments/v1/transactions
   * Lists historical transactions (paid, failed, etc.) with filters and pagination.
   */
  async listTransactions(
    params: {
      page?: number
      limit?: number
      status?: string
      type?: string
      sort?: string
    },
    token?: string,
  ): Promise<TransactionListResponse> {
    const stringParams: Record<string, string> = {}
    if (params.page !== undefined) stringParams.page = String(params.page)
    if (params.limit !== undefined) stringParams.limit = String(params.limit)
    if (params.status !== undefined) stringParams.status = params.status
    if (params.type !== undefined) stringParams.type = params.type
    if (params.sort !== undefined) stringParams.sort = params.sort

    const response = await apiClient.get<{ data: TransactionListResponse }>(
      `${this.BASE_PATH}/transactions`,
      {
        params: stringParams,
        token: token ?? this.getStoredToken(),
      },
    )
    return response.data
  }

  /**
   * POST /payments/v1/payment-methods
   * Saves a confirmed setup card to the backend database.
   */
  async savePaymentMethod(
    paymentMethodId: string,
    setAsDefault = false,
    token?: string,
  ): Promise<PaymentMethod> {
    const response = await apiClient.post<{ data: PaymentMethod }>(
      `${this.BASE_PATH}/payment-methods`,
      { paymentMethodId, setAsDefault },
      {
        token: token ?? this.getStoredToken(),
      },
    )
    return response.data
  }

  /**
   * DELETE /payments/v1/payment-methods/:paymentMethodId
   * Deletes a card from Stripe and the DB.
   */
  async deletePaymentMethod(
    paymentMethodId: string,
    token?: string,
  ): Promise<void> {
    await apiClient.delete(
      `${this.BASE_PATH}/payment-methods/${paymentMethodId}`,
      {
        token: token ?? this.getStoredToken(),
      },
    )
  }

  /**
   * PATCH /payments/v1/payment-methods/:paymentMethodId/set-default
   * Sets a payment method as default.
   */
  async setDefaultPaymentMethod(
    paymentMethodId: string,
    token?: string,
  ): Promise<void> {
    await apiClient.patch(
      `${this.BASE_PATH}/payment-methods/${paymentMethodId}/set-default`,
      {},
      {
        token: token ?? this.getStoredToken(),
      },
    )
  }

  /**
   * PATCH /payments/v1/payment-methods/:paymentMethodId
   * Updates cardholder name and expiry date.
   */
  async updatePaymentMethod(
    paymentMethodId: string,
    payload: { name?: string; expiry?: string },
    token?: string,
  ): Promise<PaymentMethod> {
    const response = await apiClient.patch<{ data: PaymentMethod }>(
      `${this.BASE_PATH}/payment-methods/${paymentMethodId}`,
      payload,
      {
        token: token ?? this.getStoredToken(),
      },
    )
    return response.data
  }
}

export const paymentService = new PaymentService()
