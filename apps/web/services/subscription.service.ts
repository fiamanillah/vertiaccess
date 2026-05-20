import { apiClient } from './api-client';

export interface PlanFeature {
  id?: string;
  name: string;
  included: boolean;
}

export interface PlanLimits {
  maxSites?: number;
  monthlyBookings?: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  billingType: 'subscription' | 'payg';
  badge: string;
  monthlyPrice: number;
  annualPrice: number;
  platformFee: number;
  includedBookings: number | null;
  currency: string;
  description: string;
  unitLabel: string;
  stripeProductId: string | null;
  stripeMonthlyPriceId: string | null;
  stripeAnnualPriceId: string | null;
  stripePaygPriceId: string | null;
  isActive: boolean;
  customFeatures: PlanFeature[];
  limits: PlanLimits;
}

export interface UserSubscriptionDetail {
  id: string;
  userId: string;
  name: string;
  email: string;
  organisation: string;
  planName: string;
  planId: string;
  billingType: 'subscription' | 'payg';
  price: number;
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  joined: string;
}

export interface UserSubscriptionStatus {
  hasActiveSubscription: boolean;
  status: string | null;
  planId: string | null;
  planName: string | null;
  billingType: 'subscription' | 'payg' | null;
  price: number | null;
  currency: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export interface SubscriptionMetrics {
  mrr: number;
  paygFeesMtd: number;
  activeSubscribers: number;
}

class SubscriptionService {
  private readonly BASE_PATH = '/subscriptions/v1';

  private getStoredToken(): string | undefined {
    if (typeof window === 'undefined') return undefined;

    const storageKeys = [
      'accessToken',
      'idToken',
      'vertiaccess_access_token',
      'vertiaccess_id_token',
    ];

    for (const key of storageKeys) {
      const value = window.localStorage.getItem(key);
      if (value) return value;
    }

    return undefined;
  }

  async listPlans(includeInactive = false, token?: string): Promise<{ success: boolean; data: SubscriptionPlan[]; message: string }> {
    return apiClient.get(`${this.BASE_PATH}/plans`, {
      params: { includeInactive: String(includeInactive) },
      token: token ?? this.getStoredToken(),
    });
  }

  async createPlan(data: Partial<SubscriptionPlan>, token?: string): Promise<{ success: boolean; data: SubscriptionPlan; message: string }> {
    return apiClient.post(`${this.BASE_PATH}/plans`, data, {
      token: token ?? this.getStoredToken(),
    });
  }

  async updatePlan(planId: string, data: Partial<SubscriptionPlan>, token?: string): Promise<{ success: boolean; data: SubscriptionPlan; message: string }> {
    return apiClient.patch(`${this.BASE_PATH}/plans/${planId}`, data, {
      token: token ?? this.getStoredToken(),
    });
  }

  async deletePlan(planId: string, token?: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete(`${this.BASE_PATH}/plans/${planId}`, {
      token: token ?? this.getStoredToken(),
    });
  }

  async listSubscriptions(token?: string): Promise<{ success: boolean; data: UserSubscriptionDetail[]; message: string }> {
    return apiClient.get(`${this.BASE_PATH}/admin/subscriptions`, {
      token: token ?? this.getStoredToken(),
    });
  }

  async getMetrics(token?: string): Promise<{ success: boolean; data: SubscriptionMetrics; message: string }> {
    return apiClient.get(`${this.BASE_PATH}/admin/metrics`, {
      token: token ?? this.getStoredToken(),
    });
  }

  async getSubscriptionStatus(token?: string): Promise<{ success: boolean; data: UserSubscriptionStatus; message: string }> {
    return apiClient.get(`${this.BASE_PATH}/me`, {
      token: token ?? this.getStoredToken(),
    });
  }

  async activatePlan(
    data: { planId: string; paymentMethodId: string; interval?: 'month' | 'year' },
    token?: string
  ): Promise<{ success: boolean; data: any; message: string }> {
    return apiClient.post(`${this.BASE_PATH}/activate`, data, {
      token: token ?? this.getStoredToken(),
    });
  }

  async cancelSubscription(immediate = false, token?: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post(`${this.BASE_PATH}/cancel`, { immediate }, {
      token: token ?? this.getStoredToken(),
    });
  }
}

export const subscriptionService = new SubscriptionService();
