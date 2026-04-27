// src/lib/bookings.ts — API client for the booking endpoints in site-service
import { getApiBaseUrl } from './api';
import type { BookingRequest } from '../types';

// ==========================================
// Public Availability Types
// ==========================================

export interface PublicAvailabilitySlot {
    startTime: string;
    endTime: string;
    status: 'PENDING' | 'APPROVED';
    useCategory: string;
}

// ==========================================
// Types
// ==========================================

export interface CreateBookingPayload {
    siteId: string;
    startTime: string; // ISO string
    endTime: string;
    droneModel: string;
    missionIntent: string;
    useCategory: 'planned_toal' | 'emergency_recovery';
    operationReference?: string;
    flyerId?: string;
    /** Required when operator has no active subscription (PAYG flow) */
    paymentIntentId?: string;
    billingMode?: 'payg' | 'subscription';
}

export interface ApiBooking {
    id: string;
    vtId: string | null;
    bookingReference: string;
    operatorId: string;
    siteId: string;
    siteName: string | null;
    siteAddress: string | null;
    landownerId: string | null;
    startTime: string;
    endTime: string;
    operationReference: string | null;
    droneModel: string | null;
    missionIntent: string | null;
    useCategory: string;
    clzUsed: boolean | null;
    clzConfirmedAt: string | null;
    flyerId: string | null;
    isPayg: boolean;
    platformFee: number | null;
    toalCost: number | null;
    cancellationFee: number | null;
    paymentMethodLast4: string | null;
    paymentMethodBrand: string | null;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';
    paymentStatus: string | null;
    createdAt: string;
    respondedAt: string | null;
    cancelledAt: string | null;
    operatorEmail: string | null;
    operatorName: string | null;
    operatorOrganisation: string | null;
    operatorFlyerId: string | null;
    siteType?: string | null;
    siteCategory?: string | null;
    sitePhotoUrl?: string | null;
    siteGeometry?: any;
    siteClzGeometry?: any;
    certificateVtId: string | null;
    certificateId: string | null;
}

export interface SubscriptionStatus {
    hasActiveSubscription: boolean;
    status: string | null;
    planName: string | null;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
}

// ==========================================
// Converters
// ==========================================

/** Maps an ApiBooking from backend to the frontend BookingRequest type */
export function apiBookingToFrontend(b: ApiBooking): BookingRequest {
    return {
        id: b.bookingReference || b.id,
        vtId: b.vtId || undefined,
        siteId: b.siteId,
        siteName: b.siteName || '',
        operatorId: b.operatorId,
        operatorName: b.operatorName || undefined,
        operatorEmail: b.operatorEmail || '',
        operatorOrganisation: b.operatorOrganisation || undefined,
        siteType: (b.siteType as any) || undefined,
        siteCategory: (b.siteCategory as any) || undefined,
        sitePhotoUrl: b.sitePhotoUrl || undefined,
        sitePhotos: b.sitePhotoUrl ? [b.sitePhotoUrl] : undefined,
        siteGeometry: b.siteGeometry || undefined,
        siteClzGeometry: b.siteClzGeometry || undefined,
        startTime: b.startTime,
        endTime: b.endTime,
        operationReference: b.operationReference || '',
        droneModel: b.droneModel || '',
        flyerId: b.operatorFlyerId || b.flyerId || '',
        missionIntent: b.missionIntent || '',
        toalCost: b.toalCost || undefined,
        platformFee: b.platformFee || undefined,
        cancellationFee: b.cancellationFee || undefined,
        paymentMethodLast4: b.paymentMethodLast4 || undefined,
        paymentMethodBrand: b.paymentMethodBrand || undefined,
        status: b.status,
        paymentStatus: b.paymentStatus as any,
        useCategory: b.useCategory as 'planned_toal' | 'emergency_recovery',
        clzUsed: b.clzUsed ?? undefined,
        clzConfirmedAt: b.clzConfirmedAt || undefined,
        isPAYG: b.isPayg,
        certificateVtId: b.certificateVtId || undefined,
        certificateId: b.certificateId || undefined,
        createdAt: b.createdAt,
        respondedAt: b.respondedAt || undefined,
        cancelledAt: b.cancelledAt || undefined,
        // store the internal DB id separately
        _dbId: b.id,
    } as BookingRequest & { _dbId: string };
}

// ==========================================
// API Functions
// ==========================================

/**
 * Create a new booking request (operator)
 */
export async function apiCreateBooking(
    idToken: string,
    payload: CreateBookingPayload
): Promise<ApiBooking> {
    const res = await fetch(`${getApiBaseUrl()}/bookings/v1/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || 'Failed to create booking');
    return json?.data as ApiBooking;
}

/**
 * Fetch the current operator's own bookings
 */
export async function apiFetchMyBookings(idToken: string): Promise<ApiBooking[]> {
    const res = await fetch(`${getApiBaseUrl()}/bookings/v1/mine`, {
        headers: { Authorization: `Bearer ${idToken}` },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || 'Failed to fetch bookings');
    return (json?.data || []) as ApiBooking[];
}

/**
 * Fetch all bookings for all of the landowner's sites
 */
export async function apiFetchLandownerBookings(idToken: string): Promise<ApiBooking[]> {
    const res = await fetch(`${getApiBaseUrl()}/bookings/v1/landowner`, {
        headers: { Authorization: `Bearer ${idToken}` },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || 'Failed to fetch landowner bookings');
    return (json?.data || []) as ApiBooking[];
}

/**
 * Fetch all bookings for a specific site (landowner/admin)
 */
export async function apiFetchSiteBookings(idToken: string, siteId: string): Promise<ApiBooking[]> {
    const res = await fetch(`${getApiBaseUrl()}/bookings/v1/site/${siteId}`, {
        headers: { Authorization: `Bearer ${idToken}` },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || 'Failed to fetch site bookings');
    return (json?.data || []) as ApiBooking[];
}

/**
 * Update a booking's status: APPROVED | REJECTED | CANCELLED
 */
export async function apiUpdateBookingStatus(
    idToken: string,
    bookingId: string,
    status: 'APPROVED' | 'REJECTED' | 'CANCELLED',
    adminNote?: string
): Promise<ApiBooking> {
    const res = await fetch(`${getApiBaseUrl()}/bookings/v1/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ status, ...(adminNote ? { adminNote } : {}) }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || 'Failed to update booking status');
    return json?.data as ApiBooking;
}

/**
 * Check the current user's subscription status (billing-service)
 */
export async function apiCheckSubscriptionStatus(idToken: string): Promise<SubscriptionStatus> {
    const res = await fetch(`${getApiBaseUrl()}/billing/v1/subscriptions/me`, {
        headers: { Authorization: `Bearer ${idToken}` },
    });
    const json = await res.json();
    if (!res.ok) {
        return {
            hasActiveSubscription: false,
            status: null,
            planName: null,
            currentPeriodStart: null,
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
        };
    }
    return json?.data as SubscriptionStatus;
}

/**
 * Create a Stripe PaymentIntent for a per-booking PAYG fee (billing-service)
 */
export async function apiCreateBookingPaymentIntent(
    idToken: string,
    siteId: string,
    amount: number,
    currency = 'GBP'
): Promise<{ clientSecret: string; paymentIntentId: string; amount: number; currency: string }> {
    const res = await fetch(`${getApiBaseUrl()}/billing/v1/booking-payment-intent`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ siteId, amount, currency }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || 'Failed to create payment intent');
    return json?.data;
}

/**
 * Fetch the consent certificate for an approved booking
 */
export async function apiGetBookingCertificate(
    idToken: string,
    bookingDbId: string
): Promise<import('../types').ConsentCertificate> {
    const res = await fetch(`${getApiBaseUrl()}/bookings/v1/${bookingDbId}/certificate`, {
        headers: { Authorization: `Bearer ${idToken}` },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || 'Failed to fetch certificate');
    return json?.data as import('../types').ConsentCertificate;
}

/**
 * Pay the landowner for an approved booking
 */
export async function apiPayLandownerBooking(
    idToken: string,
    bookingDbId: string
): Promise<{ paymentStatus: string }> {
    const res = await fetch(`${getApiBaseUrl()}/billing/v1/bookings/${bookingDbId}/pay`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
        },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || 'Failed to process payment');
    return json?.data as { paymentStatus: string };
}

/**
 * Confirm whether an Emergency & Recovery booking was actually used.
 */
export async function apiConfirmEmergencyUsage(
    idToken: string,
    bookingDbId: string,
    used: boolean
): Promise<ApiBooking> {
    const res = await fetch(`${getApiBaseUrl()}/bookings/v1/${bookingDbId}/emergency-usage`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ used }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || 'Failed to confirm emergency usage');
    return json?.data as ApiBooking;
}

/**
 * Fetch public (no-auth) availability slots for a site.
 * Returns anonymized booked/pending time windows only — no operator PII.
 * Used by the DeconflictionCalendar for all users including unauthenticated operators.
 */
export async function apiFetchPublicSiteAvailability(
    siteId: string,
    from?: string,
    to?: string
): Promise<PublicAvailabilitySlot[]> {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const suffix = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${getApiBaseUrl()}/bookings/v1/availability/${siteId}${suffix}`);
    const json = await res.json();
    if (!res.ok) return []; // Silently return empty on error — calendar still works
    return (json?.data?.slots || []) as PublicAvailabilitySlot[];
}
