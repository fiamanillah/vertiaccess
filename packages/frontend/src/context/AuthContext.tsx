// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { UserRole } from '../App';
import type { PaymentCard } from '../types';
import {
    cognitoSignIn,
    cognitoSignOut,
    cognitoGetSession,
    cognitoSignUp,
    cognitoConfirmSignUp,
    cognitoResendCode,
    parseIdTokenPayload,
    apiGetMe,
    type SignUpParams,
} from '../lib/auth';

export interface AuthUser {
    id: string; // Cognito sub
    email: string;
    role: UserRole;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    verified?: boolean;
    verificationStatus?: string;
    hasPendingVerification?: boolean;
    organisation?: string;
    flyerId?: string;
    operatorId?: string;
    paymentCard?: PaymentCard;
    planTier?: string;
    isPAYG?: boolean;
    subscriptionStatus?: string;
    passwordChangedAt?: string;
}

interface AuthContextType {
    user: AuthUser | null;
    idToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (params: SignUpParams) => Promise<string>;
    confirmSignUp: (email: string, code: string) => Promise<void>;
    resendCode: (email: string) => Promise<void>;
    logout: () => void;
    updateUser: (updates: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [idToken, setIdToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check for existing session on mount
    useEffect(() => {
        checkSession();
    }, []);

    const checkSession = async () => {
        try {
            const session = await cognitoGetSession();
            if (session) {
                const payload = parseIdTokenPayload(session);
                const token = session.getIdToken().getJwtToken();
                setIdToken(token);

                let dbUser: Record<string, unknown> = {};
                try {
                    const meData = await apiGetMe(token);
                    if (meData && typeof meData === 'object') {
                        dbUser = meData as Record<string, unknown>;
                    }
                } catch (e) {
                    console.error('Failed to fetch DB user data:', e);
                }

                // Build base user from Cognito token, then override with DB data
                // DB data contains the real verificationStatus (UNVERIFIED/VERIFIED/SUSPENDED)
                // and hasPendingVerification which tracks if a doc was submitted awaiting review
                const dbData = dbUser as any;
                const normalizedOrganisation =
                    dbData.organisation ?? dbData.organization ?? dbData.organizationName;
                setUser({
                    id: payload.sub,
                    email: payload.email,
                    role: payload.role as UserRole,
                    firstName: payload.firstName,
                    lastName: payload.lastName,
                    fullName:
                        payload.firstName && payload.lastName
                            ? `${payload.firstName} ${payload.lastName}`
                            : undefined,
                    // Default to unverified; will be overridden by DB data below
                    verified: false,
                    verificationStatus: 'UNVERIFIED',
                    hasPendingVerification: false,
                    ...dbData, // Override with DB data (verificationStatus, hasPendingVerification, org, planTier, etc)
                    organisation: normalizedOrganisation,
                });
            }
        } catch (error) {
            console.error('Session check failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = useCallback(async (email: string, password: string) => {
        const session = await cognitoSignIn(email, password);
        const payload = parseIdTokenPayload(session);
        const token = session.getIdToken().getJwtToken();
        setIdToken(token);

        let dbUser: Record<string, unknown> = {};
        try {
            const meData = await apiGetMe(token);
            if (meData && typeof meData === 'object') {
                dbUser = meData as Record<string, unknown>;
            }
        } catch (e) {
            console.error('Failed to fetch DB user data on login:', e);
        }

        const dbData = dbUser as any;
        const normalizedOrganisation =
            dbData.organisation ?? dbData.organization ?? dbData.organizationName;
        const authUser: AuthUser = {
            id: payload.sub,
            email: payload.email,
            role: payload.role as UserRole,
            firstName: payload.firstName,
            lastName: payload.lastName,
            fullName:
                payload.firstName && payload.lastName
                    ? `${payload.firstName} ${payload.lastName}`
                    : undefined,
            // Default to unverified; will be overridden by DB data below
            verified: false,
            verificationStatus: 'UNVERIFIED',
            hasPendingVerification: false,
            ...dbData, // Override with DB data (verificationStatus, hasPendingVerification, org, planTier, etc)
            organisation: normalizedOrganisation,
        };

        setUser(authUser);
    }, []);

    const register = useCallback(async (params: SignUpParams) => {
        const userSub = await cognitoSignUp(params);
        return userSub;
    }, []);

    const confirmSignUpFn = useCallback(async (email: string, code: string) => {
        await cognitoConfirmSignUp(email, code);
    }, []);

    const resendCode = useCallback(async (email: string) => {
        await cognitoResendCode(email);
    }, []);

    const logout = useCallback(() => {
        cognitoSignOut();
        setUser(null);
        setIdToken(null);
    }, []);

    const updateUser = useCallback((updates: Partial<AuthUser>) => {
        setUser(prev => (prev ? { ...prev, ...updates } : null));
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                idToken,
                isAuthenticated: !!user,
                isLoading,
                login,
                register,
                confirmSignUp: confirmSignUpFn,
                resendCode,
                logout,
                updateUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
