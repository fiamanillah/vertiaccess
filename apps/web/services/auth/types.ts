/**
 * Authentication and User Registration Types
 */

export type UserRole = 'operator' | 'assetmanager' | 'admin';

export interface RegisterRequest {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    role: UserRole;
    organisation?: string;
    flyerId?: string;
    operatorId?: string;
    contactPhone?: string;
}

export interface RegisterResponse {
    success: boolean;
    data: {
        userSub: string;
        userConfirmed: boolean;
    };
    message: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    success: boolean;
    data: {
        accessToken: string;
        idToken: string;
        refreshToken: string;
        expiresIn: number;
    };
    message: string;
}

export interface ConfirmRequest {
    email: string;
    code: string;
}

export interface OverdueBookingDetails {
    bookingId: string;
    bookingReference: string;
    siteName: string;
    amountDue: number;
    cardLast4: string | null;
}

export interface User {
    sub: string;
    email: string;
    role: UserRole;
    firstName: string;
    lastName: string;
    fullName?: string;
    verified: boolean;
    verificationStatus: string;
    hasPendingVerification: boolean;
    rejectionReason?: string | null;
    suspendedReason?: string | null;
    suspendedUntil?: string | null;
    // Payment lockout state
    paymentLocked: boolean;
    paymentLockedReason?: string | null;
    paymentLockedAt?: string | null;
    overdueBookingId?: string | null;
    overdueBookingDetails?: OverdueBookingDetails | null;
    hasFailedBookingPayment?: boolean;
    planTier?: string;
    subscriptionStatus?: string;
    organisation?: string;
    flyerId?: string;
    operatorId?: string;
    vaId?: string;
    contactPhone?: string;
    passwordChangedAt?: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    data?: unknown;
}

export interface UpdateProfileRequest {
    fullName?: string;
    organisation?: string | null;
    flyerId?: string;
    operatorId?: string | null;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}
