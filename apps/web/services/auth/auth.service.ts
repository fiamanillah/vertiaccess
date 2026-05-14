import { apiClient } from '../api-client';
import type { 
    RegisterRequest, 
    RegisterResponse, 
    LoginRequest, 
    LoginResponse,
    ConfirmRequest,
    AuthResponse
} from './types';

/**
 * Authentication Service
 * Handles all auth-related microservice calls.
 */
class AuthService {
    private readonly BASE_PATH = '/auth/v1';

    /**
     * Register a new user (Operator or Landowner)
     */
    async register(data: RegisterRequest): Promise<RegisterResponse> {
        return apiClient.post<RegisterResponse>(`${this.BASE_PATH}/register`, data);
    }

    /**
     * Log in an existing user
     */
    async login(data: LoginRequest): Promise<LoginResponse> {
        return apiClient.post<LoginResponse>(`${this.BASE_PATH}/login`, data);
    }

    /**
     * Confirm user email with the 6-digit code
     */
    async confirmEmail(data: ConfirmRequest): Promise<AuthResponse> {
        return apiClient.post<AuthResponse>(`${this.BASE_PATH}/confirm`, data);
    }

    /**
     * Resend the confirmation code
     */
    async resendConfirmationCode(email: string): Promise<AuthResponse> {
        return apiClient.post<AuthResponse>(`${this.BASE_PATH}/resend-code`, { email });
    }

    /**
     * Initiate password reset
     */
    async forgotPassword(email: string): Promise<AuthResponse> {
        return apiClient.post<AuthResponse>(`${this.BASE_PATH}/forgot-password`, { email });
    }

    /**
     * Refresh the session tokens
     */
    async refreshSession(refreshToken: string): Promise<LoginResponse> {
        return apiClient.post<LoginResponse>(`${this.BASE_PATH}/refresh`, { refreshToken });
    }
}

export const authService = new AuthService();
