export interface BillingPlan {
    id: string;
    name: string;
    billingType: 'subscription' | 'payg';
    monthlyPrice: number;
    annualPrice: number;
    platformFee?: number | null;
    includedBookings?: number | null;
    currency: string;
    description: string;
    unitLabel: string;
    isActive: boolean;
    customFeatures?: Array<{
        id: string;
        name: string;
        included: boolean;
    }>;
}

import { getApiBaseUrl } from './api';

export interface BillingPaymentMethod {
    id: string;
    stripePaymentMethodId: string;
    last4: string;
    brand: string;
    expiryMonth: number;
    expiryYear: number;
    isDefault: boolean;
    addedAt: string;
}

export async function fetchPaymentMethods(idToken: string): Promise<BillingPaymentMethod[]> {
    const res = await fetch(`${getApiBaseUrl()}/billing/v1/payment-methods`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${idToken}`,
        },
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new Error(json?.message || 'Failed to fetch payment methods');
    }

    return (json?.data || []) as BillingPaymentMethod[];
}

export async function fetchPublicPlans(): Promise<BillingPlan[]> {
    const res = await fetch(`${getApiBaseUrl()}/billing/v1/plans`);
    const json = await res.json();

    if (!res.ok) {
        throw new Error(json?.message || 'Failed to load plans');
    }

    return (json?.data || []) as BillingPlan[];
}

export async function fetchAdminPlans(idToken: string): Promise<BillingPlan[]> {
    const res = await fetch(`${getApiBaseUrl()}/billing/v1/plans?includeInactive=true`, {
        headers: {
            Authorization: `Bearer ${idToken}`,
        },
    });
    const json = await res.json();

    if (!res.ok) {
        throw new Error(json?.message || 'Failed to load plans');
    }

    return (json?.data || []) as BillingPlan[];
}

export async function activateBillingPlan(params: {
    idToken: string;
    planId: string;
    paymentMethodId: string;
    interval?: 'month' | 'year';
}) {
    const res = await fetch(`${getApiBaseUrl()}/billing/v1/subscriptions/activate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${params.idToken}`,
        },
        body: JSON.stringify({
            planId: params.planId,
            paymentMethodId: params.paymentMethodId,
            interval: params.interval,
        }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(json?.message || 'Failed to activate plan');
    }

    return json?.data;
}

export async function createBillingPlan(
    idToken: string,
    plan: {
        name: string;
        billingType: 'subscription' | 'payg';
        monthlyPrice?: number;
        platformFee?: number;
        annualPrice?: number;
        includedBookings?: number;
        currency?: string;
        description?: string;
        unitLabel?: string;
        isActive?: boolean;
    }
) {
    const res = await fetch(`${getApiBaseUrl()}/billing/v1/plans`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(plan),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(json?.message || 'Failed to create plan');
    }

    return json?.data;
}

export async function updateBillingPlan(
    idToken: string,
    planId: string,
    plan: {
        name?: string;
        monthlyPrice?: number;
        platformFee?: number;
        annualPrice?: number;
        includedBookings?: number;
        currency?: string;
        description?: string;
        unitLabel?: string;
        isActive?: boolean;
    }
) {
    const res = await fetch(`${getApiBaseUrl()}/billing/v1/plans/${planId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(plan),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(json?.message || 'Failed to update plan');
    }

    return json?.data;
}

export async function deactivateBillingPlan(idToken: string, planId: string) {
    const res = await fetch(`${getApiBaseUrl()}/billing/v1/plans/${planId}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${idToken}`,
        },
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(json?.message || 'Failed to deactivate plan');
    }

    return json?.data;
}
