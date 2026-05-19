/**
 * Base API client for making requests to microservices.
 * Handles base URL, headers, and error normalization.
 */
import { getIdToken, getRefreshToken } from '@/lib/cookies'
import { useAuthStore } from '@/store/use-auth-store'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

// Global lock to prevent concurrent refresh requests
let refreshPromise: Promise<string | null> | null = null

export interface ApiRequestOptions extends RequestInit {
  params?: Record<string, string>
  token?: string | null
  retries?: number
  retryDelay?: number
}

export interface ApiErrorData {
  error?: {
    code?: string
    message?: string
    details?: unknown
  }
}

export class ApiError extends Error {
  constructor(
    public message: string,
    public status: number,
    public data?: ApiErrorData,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    params,
    token: providedToken,
    retries,
    retryDelay,
    ...customConfig
  } = options

  // Construct URL with query params
  const url = new URL(`${BASE_URL}${endpoint}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, value)
      }
    })
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customConfig.headers as Record<string, string>),
  }

  // Determine if we should send the Authorization header.
  // Don't send for auth routes unless explicitly provided.
  const isAuthRoute = endpoint.startsWith('/auth/')

  let token = providedToken
  if (token === undefined) {
    // Fallback to cookie if not an auth route.
    token =
      !isAuthRoute && typeof window !== 'undefined' ? getIdToken() : undefined
  }

  if (token && token !== null) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const config: RequestInit = {
    ...customConfig,
    headers,
  }

  const method = (options.method || 'GET').toUpperCase()
  const isIdempotent = ['GET', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'].includes(method)

  // Set default maxRetries: 2 for idempotent methods, 0 for non-idempotent methods
  const maxRetries = retries !== undefined ? retries : (isIdempotent ? 2 : 0)
  const baseDelay = retryDelay !== undefined ? retryDelay : 1000
  let retryCount = 0

  async function performRequest(): Promise<T> {
    try {
      if (typeof window !== 'undefined') {
        try {
          // Helpful debug info in browser console when diagnosing network issues

          console.debug('apiClient.performRequest', {
            method: (config && (config as RequestInit).method) || 'GET',
            url: url.toString(),
            headers,
            body: (config as RequestInit).body,
          })
        } catch {
          // swallow logging errors
        }
      }

      const response = await fetch(url.toString(), config)

      // Handle 204 No Content
      if (response.status === 204) {
        return {} as T
      }

      const data = await response.json()

      if (!response.ok) {
        // Handle account payment lockout — redirect to resolution page
        if (response.status === 403) {
          const errorCode = data?.error
          if (errorCode === 'ACCOUNT_PAYMENT_LOCKED' && typeof window !== 'undefined') {
            window.location.href = '/dashboard/operator/billing/overdue'
            return {} as T
          }
        }

        // Handle 401 Unauthorized globally
        if (response.status === 401 && typeof window !== 'undefined') {
          // Only attempt refresh if we were trying to use a token
          if (headers['Authorization']) {
            const refreshToken = getRefreshToken()
            if (refreshToken) {
              if (!refreshPromise) {
                refreshPromise = (async () => {
                  try {
                    const res = await fetch(`${BASE_URL}/auth/v1/refresh`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ refreshToken }),
                    })
                    if (!res.ok) throw new Error('Refresh failed')
                    const refreshData = await res.json()
                    useAuthStore.getState().updateTokens(refreshData.data)
                    return refreshData.data.accessToken
                  } catch {
                    useAuthStore.getState().logout()
                    return null
                  } finally {
                    refreshPromise = null
                  }
                })()
              }

              const newAccessToken = await refreshPromise
              if (newAccessToken) {
                // Update closure variables for the recursive retry
                headers['Authorization'] = `Bearer ${newAccessToken}`
                config.headers = headers
                return performRequest()
              }
            }
            useAuthStore.getState().logout()
          }
        }

        const errorMessage =
          data.error?.message ||
          data.message ||
          response.statusText ||
          'An error occurred'
        throw new ApiError(errorMessage, response.status, data)
      }

      return data
    } catch (error) {
      if (error instanceof ApiError) throw error

      // Check if this error is a retryable network/fetch failure
      const errorMessage = error instanceof Error ? error.message.toLowerCase() : ''
      const isRetryableNetworkError =
        errorMessage.includes('failed to fetch') ||
        errorMessage.includes('fetch failed') ||
        errorMessage.includes('network') ||
        errorMessage.includes('load failed') ||
        errorMessage.includes('network_changed') ||
        errorMessage.includes('network changed') ||
        errorMessage.includes('aborted')

      // Retry on network errors if we have retries left and it is a transient error
      if (
        retryCount < maxRetries &&
        isRetryableNetworkError
      ) {
        retryCount++
        const delay = baseDelay * Math.pow(2, retryCount - 1)
        console.warn(
          `Retrying request to ${endpoint} (${retryCount}/${maxRetries}) in ${delay}ms due to: ${error instanceof Error ? error.message : 'Network error'}`,
        )
        // Wait with exponential backoff before retrying
        await new Promise((resolve) => setTimeout(resolve, delay))
        return performRequest()
      }

      // Exhausted retries. Log the network error to console.
      if (typeof window !== 'undefined') {
        try {
          const nav = navigator as unknown as {
            connection?: {
              effectiveType?: string
              downlink?: number
              rtt?: number
            }
          }

          const navigatorInfo: Record<string, unknown> = {
            onLine: navigator.onLine,
          }
          // navigator.connection may not exist in all browsers
          if (nav.connection) {
            navigatorInfo.connection = {
              effectiveType: nav.connection.effectiveType,
              downlink: nav.connection.downlink,
              rtt: nav.connection.rtt,
            }
          }

          console.error('apiClient.networkError', {
            timestamp: new Date().toISOString(),
            endpoint,
            url: url.toString(),
            method: (config && (config as RequestInit).method) || 'GET',
            navigator: navigatorInfo,
            error:
              error instanceof Error
                ? {
                    name: error.name,
                    message: error.message,
                    stack: error.stack,
                  }
                : String(error),
          })
        } catch {
          // swallow logging errors
        }
      }

      throw new ApiError(
        error instanceof Error ? error.message : 'Network error',
        500,
      )
    }
  }

  return performRequest()
}

export const apiClient = {
  get: <T>(endpoint: string, options?: ApiRequestOptions) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    }),

  put: <T>(endpoint: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  patch: <T>(endpoint: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  delete: <T>(endpoint: string, options?: ApiRequestOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
}
