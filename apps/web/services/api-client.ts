/**
 * Base API client for making requests to microservices.
 * Handles base URL, headers, and error normalization.
 */
import { getIdToken, clearAuthCookies } from '@/lib/cookies'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export interface ApiRequestOptions extends RequestInit {
  params?: Record<string, string>
  token?: string | null
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
  const { params, token: providedToken, ...customConfig } = options

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

  const maxRetries = 2
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
        } catch (e) {
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
        // Handle 401 Unauthorized globally
        if (response.status === 401 && typeof window !== 'undefined') {
          // Only clear cookies if we were trying to use a token
          if (headers['Authorization']) {
            clearAuthCookies()
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

      if (typeof window !== 'undefined') {
        try {
          const navigatorInfo: Record<string, unknown> = {
            onLine: (navigator as any).onLine,
          }
          // navigator.connection may not exist in all browsers
          if ((navigator as any).connection) {
            const conn = (navigator as any).connection
            navigatorInfo.connection = {
              effectiveType: conn.effectiveType,
              downlink: conn.downlink,
              rtt: conn.rtt,
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
        } catch (e) {
          // swallow logging errors
        }
      }

      // Retry on network errors for GET requests
      if (
        options.method === 'GET' &&
        retryCount < maxRetries &&
        error instanceof Error &&
        (error.message === 'Failed to fetch' ||
          error.message.includes('network'))
      ) {
        retryCount++
        console.warn(
          `Retrying request to ${endpoint} (${retryCount}/${maxRetries})...`,
        )
        // Wait a bit before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount))
        return performRequest()
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
