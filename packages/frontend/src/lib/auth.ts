// src/lib/auth.ts
import {
    CognitoUser,
    AuthenticationDetails,
    CognitoUserAttribute,
    CognitoUserSession,
} from 'amazon-cognito-identity-js';
import { userPool } from './cognito';
import { getApiBaseUrl } from './api';

/**
 * Helper to safely parse API JSON responses with type safety
 */
function parseApiResponse<T>(data: unknown): T & { message?: string } {
    if (data && typeof data === 'object') {
        return data as T & { message?: string };
    }
    return {} as T & { message?: string };
}

export interface SignUpParams {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'landowner' | 'operator';
    organisation?: string;
    flyerId?: string;
    operatorId?: string;
    contactPhone?: string;
}

export interface AuthTokens {
    idToken: string;
    accessToken: string;
    refreshToken: string;
}

export async function cognitoSignUp(params: SignUpParams): Promise<string> {
    const response = await fetch(`${getApiBaseUrl()}/auth/v1/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
    });

    const data = parseApiResponse<{ data: { userSub: string } }>(await response.json());

    if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
    }

    return data.data.userSub;
}

export async function apiGetMe(idToken: string) {
    const response = await fetch(`${getApiBaseUrl()}/auth/v1/me`, {
        headers: { Authorization: `Bearer ${idToken}` },
    });
    if (!response.ok) throw new Error('Failed to fetch me');
    const data = parseApiResponse<{ data: unknown }>(await response.json());
    return data.data;
}

export async function apiCreateCheckoutSession(idToken: string, planTier: string) {
    const response = await fetch(`${getApiBaseUrl()}/billing/v1/checkout`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
            planTier,
            successUrl:
                typeof window !== 'undefined'
                    ? window.location.origin + '/operator?payment=success'
                    : '',
            cancelUrl:
                typeof window !== 'undefined'
                    ? window.location.origin + '/operator?payment=canceled'
                    : '',
        }),
    });
    if (!response.ok) throw new Error('Failed to create checkout session');
    const data = parseApiResponse<{ data: { url: string } }>(await response.json());
    return data.data.url;
}

/**
 * Confirm sign-up with verification code
 */
export function cognitoConfirmSignUp(email: string, code: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const cognitoUser = new CognitoUser({
            Username: email,
            Pool: userPool,
        });

        cognitoUser.confirmRegistration(code, true, (err: Error | null) => {
            if (err) {
                reject(err);
                return;
            }
            resolve();
        });
    });
}

/**
 * Sign in a user and return the session
 */
export function cognitoSignIn(email: string, password: string): Promise<CognitoUserSession> {
    return new Promise((resolve, reject) => {
        const cognitoUser = new CognitoUser({
            Username: email,
            Pool: userPool,
        });

        const authDetails = new AuthenticationDetails({
            Username: email,
            Password: password,
        });

        cognitoUser.authenticateUser(authDetails, {
            onSuccess: (session: CognitoUserSession) => {
                resolve(session);
            },
            onFailure: (err: Error) => {
                reject(err);
            },
        });
    });
}

/**
 * Sign out the current user
 */
export function cognitoSignOut(): void {
    const currentUser = userPool.getCurrentUser();
    if (currentUser) {
        currentUser.signOut();
    }
}

/**
 * Get the current session (validates and refreshes tokens automatically)
 */
export function cognitoGetSession(): Promise<CognitoUserSession | null> {
    return new Promise(resolve => {
        const currentUser = userPool.getCurrentUser();
        if (!currentUser) {
            resolve(null);
            return;
        }

        currentUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
            if (err || !session || !session.isValid()) {
                resolve(null);
                return;
            }
            resolve(session);
        });
    });
}

/**
 * Get tokens from the current session
 */
export function getTokensFromSession(session: CognitoUserSession): AuthTokens {
    return {
        idToken: session.getIdToken().getJwtToken(),
        accessToken: session.getAccessToken().getJwtToken(),
        refreshToken: session.getRefreshToken().getToken(),
    };
}

/**
 * Parse user info from the ID token payload
 */
export function parseIdTokenPayload(session: CognitoUserSession) {
    const payload = session.getIdToken().decodePayload();
    return {
        sub: payload.sub as string,
        email: payload.email as string,
        role: (payload['custom:role'] as string) || 'operator',
        firstName: (payload['custom:firstName'] as string) || '',
        lastName: (payload['custom:lastName'] as string) || '',
        emailVerified: payload.email_verified === true || payload.email_verified === 'true',
    };
}

/**
 * Initiate forgot password flow
 */
export function cognitoForgotPassword(email: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const cognitoUser = new CognitoUser({
            Username: email,
            Pool: userPool,
        });

        cognitoUser.forgotPassword({
            onSuccess: () => {
                resolve();
            },
            onFailure: (err: Error) => {
                reject(err);
            },
        });
    });
}

/**
 * Complete forgot password with code and new password
 */
export function cognitoResetPassword(
    email: string,
    code: string,
    newPassword: string
): Promise<void> {
    return new Promise((resolve, reject) => {
        const cognitoUser = new CognitoUser({
            Username: email,
            Pool: userPool,
        });

        cognitoUser.confirmPassword(code, newPassword, {
            onSuccess: () => {
                resolve();
            },
            onFailure: (err: Error) => {
                reject(err);
            },
        });
    });
}

/**
 * Resend confirmation code
 */
export function cognitoResendCode(email: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const cognitoUser = new CognitoUser({
            Username: email,
            Pool: userPool,
        });

        cognitoUser.resendConfirmationCode((err: Error | undefined) => {
            if (err) {
                reject(err);
                return;
            }
            resolve();
        });
    });
}

/**
 * Change password for the currently authenticated user.
 */
export function cognitoChangePassword(currentPassword: string, newPassword: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const currentUser = userPool.getCurrentUser();
        if (!currentUser) {
            reject(new Error('No authenticated user found. Please sign in again.'));
            return;
        }

        currentUser.getSession((sessionErr: Error | null) => {
            if (sessionErr) {
                reject(sessionErr);
                return;
            }

            currentUser.changePassword(
                currentPassword,
                newPassword,
                (changeErr: Error | undefined, result: string | undefined) => {
                    if (changeErr) {
                        reject(changeErr);
                        return;
                    }

                    if (!result) {
                        reject(new Error('Password change failed. Please try again.'));
                        return;
                    }

                    resolve();
                }
            );
        });
    });
}

/**
 * Submit identity document for verification (landowners only — national ID or passport)
 */
export async function apiSubmitIdentity(
    idToken: string,
    documentType: 'national_id' | 'passport',
    fileKey: string
): Promise<any> {
    const response = await fetch(`${getApiBaseUrl()}/auth/v1/users/me/identity`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ documentType, fileKey }),
    });

    if (!response.ok) {
        const error = parseApiResponse<unknown>(await response.json());
        throw new Error(error.message || 'Failed to submit identity document');
    }

    return response.json();
}

/**
 * Submit operator credentials for verification.
 * No body required — the backend reads flyerId / operatorReference
 * from the operator's existing profile.
 */
export async function apiSubmitOperatorVerification(idToken: string): Promise<any> {
    return apiSubmitOperatorVerificationWithDocuments(idToken, []);
}

export async function apiSubmitOperatorVerificationWithDocuments(
    idToken: string,
    supportingDocuments: Array<{ fileKey: string; fileName?: string }>,
    identityDocument?: { documentType: string; fileKey: string }
): Promise<any> {
    const response = await fetch(`${getApiBaseUrl()}/auth/v1/users/me/operator-verification`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ supportingDocuments, identityDocument }),
    });

    if (!response.ok) {
        const error = parseApiResponse<unknown>(await response.json());
        if (response.status === 404) {
            throw new Error(
                'Operator verification endpoint is not deployed on the current API stage yet. Deploy auth-service and try again.'
            );
        }
        throw new Error(error.message || 'Failed to submit operator verification');
    }

    return response.json();
}

/**
 * Admin: Get all users
 */
export async function apiGetUsers(idToken: string): Promise<any[]> {
    const response = await fetch(`${getApiBaseUrl()}/auth/v1/admin/users`, {
        headers: { Authorization: `Bearer ${idToken}` },
    });
    const data = parseApiResponse<{ data: any[] }>(await response.json());
    if (!response.ok) throw new Error(data.message || 'Failed to fetch users');
    return data.data;
}

/**
 * Admin: Get all verifications
 */
export async function apiGetVerifications(idToken: string): Promise<any[]> {
    const response = await fetch(`${getApiBaseUrl()}/auth/v1/admin/verifications`, {
        headers: { Authorization: `Bearer ${idToken}` },
    });
    const data = parseApiResponse<{ data: any[] }>(await response.json());
    if (!response.ok) throw new Error(data.message || 'Failed to fetch verifications');
    return data.data;
}

/**
 * Admin: Update verification status
 */
export async function apiUpdateVerification(
    idToken: string,
    id: string,
    status: string,
    adminNote?: string
): Promise<any> {
    const response = await fetch(`${getApiBaseUrl()}/auth/v1/admin/verifications/${id}`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${idToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, ...(adminNote ? { adminNote } : {}) }),
    });
    const data = parseApiResponse<{ data: any }>(await response.json());
    if (!response.ok) throw new Error(data.message || 'Failed to update verification');
    return data.data;
}

/**
 * Admin: Get dashboard statistics
 */
export async function apiGetAdminStats(idToken: string): Promise<any> {
    const response = await fetch(`${getApiBaseUrl()}/auth/v1/admin/stats`, {
        headers: { Authorization: `Bearer ${idToken}` },
    });
    const data = parseApiResponse<{ data: any }>(await response.json());
    if (!response.ok) throw new Error(data.message || 'Failed to fetch admin stats');
    return data.data;
}
