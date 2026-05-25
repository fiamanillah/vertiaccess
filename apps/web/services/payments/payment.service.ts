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

export interface SetupIntentResponse {
  clientSecret: string | null
  setupIntentId: string
  publishableKey: string | null
}

class PaymentService {
  private readonly BASE_PATH = '/payments/v1'



  async getLandownerBalance(): Promise<LandownerBalanceData> {
    const response = await apiClient.get<{ data: LandownerBalanceData }>(
      `${this.BASE_PATH}/landowner/balance`,
    )

    return response.data
  }

  async listWithdrawals(): Promise<WithdrawalSummary[]> {
    const response = await apiClient.get<{ data: WithdrawalSummary[] }>(
      `${this.BASE_PATH}/landowner/withdrawals`,
    )

    return response.data
  }

  async connectStripeAccount(
    country = 'GB',
  ): Promise<StripeConnectResponse> {
    const response = await apiClient.post<{ data: StripeConnectResponse }>(
      `${this.BASE_PATH}/landowner/stripe-connect`,
      { country },
    )

    return response.data
  }

  async createWithdrawalRequest(
    amount: number,
  ): Promise<CreateWithdrawalResponse> {
    const response = await apiClient.post<{ data: CreateWithdrawalResponse }>(
      `${this.BASE_PATH}/landowner/withdrawals`,
      { amount },
    )

    return response.data
  }

  /**
   * GET /billing/v1/payment-methods
   * Returns all saved cards for the authenticated operator.
   */
  /**
   * GET /billing/v1/payment-methods
   * Returns all saved cards for the authenticated operator.
   */
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    const response = await apiClient.get<{ data: PaymentMethod[] }>(
      `${this.BASE_PATH}/payment-methods`,
    )
    return response.data
  }

  /**
   * POST /billing/v1/payment-methods/retry-overdue
   * Retries a failed emergency charge after the operator has updated their card.
   * On success, their account is unlocked (PAYMENT_LOCKED → VERIFIED).
   */
  async retryOverduePayment(): Promise<{ status: 'unlocked' }> {
    const response = await apiClient.post<{ data: { status: 'unlocked' } }>(
      `${this.BASE_PATH}/payment-methods/retry-overdue`,
      {},
    )
    return response.data
  }

  async createSetupIntent(): Promise<SetupIntentResponse> {
    const response = await apiClient.post<{ data: SetupIntentResponse }>(
      `${this.BASE_PATH}/payment-methods/setup-intent`,
      {},
    )

    return response.data
  }

  /**
   * GET /payments/v1/transactions
   * Lists historical transactions (paid, failed, etc.) with filters and pagination.
   */
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
  ): Promise<PaymentMethod> {
    const response = await apiClient.post<{ data: PaymentMethod }>(
      `${this.BASE_PATH}/payment-methods`,
      { paymentMethodId, setAsDefault },
    )
    return response.data
  }

  /**
   * DELETE /payments/v1/payment-methods/:paymentMethodId
   * Deletes a card from Stripe and the DB.
   */
  async deletePaymentMethod(
    paymentMethodId: string,
  ): Promise<void> {
    await apiClient.delete(
      `${this.BASE_PATH}/payment-methods/${paymentMethodId}`,
    )
  }

  /**
   * PATCH /payments/v1/payment-methods/:paymentMethodId/set-default
   * Sets a payment method as default.
   */
  async setDefaultPaymentMethod(
    paymentMethodId: string,
  ): Promise<void> {
    await apiClient.patch(
      `${this.BASE_PATH}/payment-methods/${paymentMethodId}/set-default`,
      {},
    )
  }

  /**
   * PATCH /payments/v1/payment-methods/:paymentMethodId
   * Updates cardholder name and expiry date.
   */
  async updatePaymentMethod(
    paymentMethodId: string,
    payload: { name?: string; expiry?: string },
  ): Promise<PaymentMethod> {
    const response = await apiClient.patch<{ data: PaymentMethod }>(
      `${this.BASE_PATH}/payment-methods/${paymentMethodId}`,
      payload,
    )
    return response.data
  }
}

export const paymentService = new PaymentService()
