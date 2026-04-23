// src/lib/withdrawals.ts
import { getApiBaseUrl } from './api';

export interface LandownerBalance {
    availableBalance: number;
    pendingBalance: number;
    withdrawnBalance: number;
    currency: string;
    lastCalculatedAt: string;
    stripeConnected: boolean;
    totalEarned: number;
}

export interface WithdrawalRequest {
    id: string;
    amount: number;
    currency: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    requestedAt: string;
    completedAt: string | null;
    stripePayoutId: string;
}

export interface WithdrawalDetails extends WithdrawalRequest {
    processedAt: string | null;
    failureReason: string | null;
    transactions: any[];
}

function toNumber(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function mapLandownerBalance(raw: any): LandownerBalance {
    return {
        availableBalance: toNumber(raw?.availableBalance),
        pendingBalance: toNumber(raw?.pendingBalance),
        withdrawnBalance: toNumber(raw?.withdrawnBalance),
        currency: raw?.currency || 'GBP',
        lastCalculatedAt: raw?.lastCalculatedAt || new Date().toISOString(),
        stripeConnected: Boolean(raw?.stripeConnected),
        totalEarned: toNumber(raw?.totalEarned),
    };
}

function mapWithdrawal(raw: any): WithdrawalRequest {
    return {
        id: String(raw?.id || ''),
        amount: toNumber(raw?.amount),
        currency: raw?.currency || 'GBP',
        status: raw?.status,
        requestedAt: raw?.requestedAt || new Date().toISOString(),
        completedAt: raw?.completedAt || null,
        stripePayoutId: raw?.stripePayoutId || '',
    };
}

/**
 * Get landowner's current balance
 */
export async function getLandownerBalance(idToken: string): Promise<LandownerBalance> {
    const res = await fetch(`${getApiBaseUrl()}/billing/v1/landowner/balance`, {
        headers: { Authorization: `Bearer ${idToken}` },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || 'Failed to fetch balance');
    return mapLandownerBalance(json?.data);
}

/**
 * Connect Stripe account for payouts
 */
export async function connectStripeAccount(
    idToken: string,
    country = 'GB'
): Promise<{ accountId: string; onboardingUrl: string }> {
    const res = await fetch(`${getApiBaseUrl()}/billing/v1/landowner/stripe-connect`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ country }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || 'Failed to connect Stripe account');
    return json?.data;
}

/**
 * Create a new withdrawal request
 */
export async function createWithdrawalRequest(
    idToken: string,
    amount: number
): Promise<WithdrawalRequest> {
    const res = await fetch(`${getApiBaseUrl()}/billing/v1/landowner/withdrawals`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ amount }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || 'Failed to create withdrawal request');
    return mapWithdrawal(json?.data);
}

/**
 * Get withdrawal history
 */
export async function listWithdrawals(idToken: string): Promise<WithdrawalRequest[]> {
    const res = await fetch(`${getApiBaseUrl()}/billing/v1/landowner/withdrawals`, {
        headers: { Authorization: `Bearer ${idToken}` },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || 'Failed to fetch withdrawals');
    return (json?.data || []).map(mapWithdrawal) as WithdrawalRequest[];
}

/**
 * Get specific withdrawal details
 */
export async function getWithdrawalDetails(
    idToken: string,
    withdrawalId: string
): Promise<WithdrawalDetails> {
    const res = await fetch(`${getApiBaseUrl()}/billing/v1/landowner/withdrawals/${withdrawalId}`, {
        headers: { Authorization: `Bearer ${idToken}` },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || 'Failed to fetch withdrawal details');
    const raw = json?.data || {};
    return {
        ...mapWithdrawal(raw),
        processedAt: raw?.processedAt || null,
        failureReason: raw?.failureReason || null,
        transactions: Array.isArray(raw?.transactions) ? raw.transactions : [],
    };
}

/**
 * Cancel pending withdrawal
 */
export async function cancelWithdrawal(
    idToken: string,
    withdrawalId: string
): Promise<{ id: string; status: string }> {
    const res = await fetch(
        `${getApiBaseUrl()}/billing/v1/landowner/withdrawals/${withdrawalId}/cancel`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${idToken}`,
            },
        }
    );
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || 'Failed to cancel withdrawal');
    return json?.data;
}
