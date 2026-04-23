/**
 * Utility to extract and display backend error messages
 */

interface BackendError {
    message?: string;
    error?: string;
    detail?: string;
    details?: string;
    statusCode?: number;
    code?: string;
}

/**
 * Extract backend error message from various error formats
 */
export function extractErrorMessage(error: any, fallback = 'An error occurred'): string {
    if (!error) return fallback;

    // If it's already a string
    if (typeof error === 'string') {
        return error;
    }

    // Check common error properties
    if (error.message) return error.message;
    if (error.error) {
        if (typeof error.error === 'string') return error.error;
        if (typeof error.error === 'object' && error.error.message) return error.error.message;
    }
    if (error.detail) return error.detail;
    if (error.details) {
        if (typeof error.details === 'string') return error.details;
        if (Array.isArray(error.details) && error.details.length > 0) {
            return error.details.map((d: any) => d.message || d).join(', ');
        }
    }

    // Check response body
    if (error.response?.data) {
        const data = error.response.data;
        if (data.message) return data.message;
        if (data.error) return typeof data.error === 'string' ? data.error : data.error.message;
        if (data.detail) return data.detail;
    }

    return fallback;
}

/**
 * Check if error is from backend (has HTTP status)
 */
export function isBackendError(error: any): boolean {
    return (
        error?.response?.status ||
        error?.statusCode ||
        (error?.response?.data && typeof error.response.data === 'object')
    );
}

/**
 * Format error for user display
 */
export function formatErrorForDisplay(error: any): { message: string; isBackendError: boolean } {
    const message = extractErrorMessage(error);
    const isBackend = isBackendError(error);

    return {
        message,
        isBackendError: isBackend,
    };
}

/**
 * Get HTTP status code from error
 */
export function getErrorStatusCode(error: any): number | null {
    return error?.response?.status || error?.statusCode || null;
}

/**
 * Build user-friendly error message with context
 */
export function buildContextualError(error: any, action: string): string {
    const { message, isBackendError } = formatErrorForDisplay(error);
    const statusCode = getErrorStatusCode(error);

    if (isBackendError && message && message !== 'An error occurred') {
        // User the backend's message as it's more specific
        return message;
    }

    // Fallback to contextual message
    return `Failed to ${action}. ${message}`;
}
