import { apiClient } from '../api-client'
import type {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  ConfirmRequest,
  AuthResponse,
  User,
  UpdateProfileRequest,
} from './types'

/**
 * Authentication Service
 * Handles all auth-related microservice calls.
 */
class AuthService {
  private readonly BASE_PATH = '/auth/v1'

  /**
   * Register a new user (Operator or Landowner)
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    return apiClient.post<RegisterResponse>(`${this.BASE_PATH}/register`, data)
  }

  /**
   * Log in an existing user
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>(`${this.BASE_PATH}/login`, data)
  }

  /**
   * Confirm user email with the 6-digit code
   */
  async confirmEmail(data: ConfirmRequest): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>(`${this.BASE_PATH}/confirm`, data)
  }

  /**
   * Resend the confirmation code
   */
  async resendConfirmationCode(email: string): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>(`${this.BASE_PATH}/resend-code`, {
      email,
    })
  }

  /**
   * Initiate password reset
   */
  async forgotPassword(email: string): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>(`${this.BASE_PATH}/forgot-password`, {
      email,
    })
  }

  /**
   * Refresh the session tokens
   */
  async refreshSession(refreshToken: string): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>(`${this.BASE_PATH}/refresh`, {
      refreshToken,
    })
  }
  /**
   * Get the current user's profile
   */
  async getCurrentUser(
    token?: string | null,
  ): Promise<{ success: boolean; data: User }> {
    return apiClient.get<{ success: boolean; data: User }>('/users/v1/me', {
      token: token ?? undefined,
    })
  }

  /**
   * Update the current user's profile
   */
  async updateProfile(data: UpdateProfileRequest): Promise<AuthResponse> {
    return apiClient.patch<AuthResponse>('/users/v1/me/profile', data)
  }

  /**
   * Submit identity verification documents
   */
  async submitIdentityVerification(data: {
    documentType: string
    fileKey: string
  }): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/users/v1/me/identity', data)
  }

  /**
   * Submit operator verification (Identity + Pilot License)
   */
  async submitOperatorVerification(data: {
    identityDocument: { documentType: string; fileKey: string }
    supportingDocuments: { fileKey: string; fileName?: string }[]
  }): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/users/v1/me/operator-verification', data)
  }

  /**
   * Log out the current user
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post(`${this.BASE_PATH}/logout`, {})
    } catch (error) {
      // Ignore errors on logout as we are clearing local state anyway
      console.warn('Backend logout failed:', error)
    }
  }
}

export const authService = new AuthService()
