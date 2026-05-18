import { create } from 'zustand';
import { setAuthCookies, clearAuthCookies } from '@/lib/cookies';
import type { User, LoginResponse } from '@/services/auth/types';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    tokens: {
        accessToken: string | null;
        idToken: string | null;
        refreshToken: string | null;
    };
    setAuth: (tokens: LoginResponse['data'], user: User) => void;
    updateTokens: (newTokens: { accessToken: string; idToken: string; expiresIn: number }) => void;
    setUser: (user: User) => void;
    logout: () => void;
    setLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    tokens: {
        accessToken: null,
        idToken: null,
        refreshToken: null,
    },
    setAuth: (tokens, user) => {
        setAuthCookies(tokens);
        set({
            user,
            isAuthenticated: true,
            isLoading: false,
            tokens: {
                accessToken: tokens.accessToken,
                idToken: tokens.idToken,
                refreshToken: tokens.refreshToken,
            },
        });
    },
    updateTokens: (newTokens) => {
        set((state) => {
            const currentRefreshToken = state.tokens.refreshToken;
            if (currentRefreshToken) {
                setAuthCookies({
                    accessToken: newTokens.accessToken,
                    idToken: newTokens.idToken,
                    refreshToken: currentRefreshToken,
                    expiresIn: newTokens.expiresIn,
                });
            }
            return {
                tokens: {
                    ...state.tokens,
                    accessToken: newTokens.accessToken,
                    idToken: newTokens.idToken,
                },
            };
        });
    },
    setUser: (user) => set({ user, isAuthenticated: true }),
    logout: () => {
        clearAuthCookies();
        set({
            user: null,
            isAuthenticated: false,
            tokens: {
                accessToken: null,
                idToken: null,
                refreshToken: null,
            },
        });
    },
    setLoading: (isLoading) => set({ isLoading }),
}));
