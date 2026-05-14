/**
 * Base API client for making requests to microservices.
 * Handles base URL, headers, and error normalization.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface ApiRequestOptions extends RequestInit {
    params?: Record<string, string>;
    token?: string;
}

export class ApiError extends Error {
    constructor(
        public message: string,
        public status: number,
        public data?: any
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

async function request<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
    const { params, token, ...customConfig } = options;
    
    // Construct URL with query params
    const url = new URL(`${BASE_URL}${endpoint}`);
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined) {
                url.searchParams.append(key, value);
            }
        });
    }

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(customConfig.headers as Record<string, string>),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
        ...customConfig,
        headers,
    };

    try {
        const response = await fetch(url.toString(), config);
        
        // Handle 204 No Content
        if (response.status === 204) {
            return {} as T;
        }

        const data = await response.json();

        if (!response.ok) {
            throw new ApiError(
                data.message || response.statusText || 'An error occurred',
                response.status,
                data
            );
        }

        return data;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        
        throw new ApiError(
            error instanceof Error ? error.message : 'Network error',
            500
        );
    }
}

export const apiClient = {
    get: <T>(endpoint: string, options?: ApiRequestOptions) => 
        request<T>(endpoint, { ...options, method: 'GET' }),
    
    post: <T>(endpoint: string, body?: any, options?: ApiRequestOptions) => 
        request<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
    
    put: <T>(endpoint: string, body?: any, options?: ApiRequestOptions) => 
        request<T>(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
    
    patch: <T>(endpoint: string, body?: any, options?: ApiRequestOptions) => 
        request<T>(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
    
    delete: <T>(endpoint: string, options?: ApiRequestOptions) => 
        request<T>(endpoint, { ...options, method: 'DELETE' }),
};
