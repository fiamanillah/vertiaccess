import { apiClient } from './api-client';

export interface VerificationRequest {
    id: string;
    type: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    userId: string;
    userEmail: string;
    userName: string;
    userOrganisation: string;
    userRole: string;
    flyerId: string | null;
    submittedDocuments: any[] | null;
    createdAt: string;
    reviewedAt: string | null;
}

export interface VerificationsCounts {
    PENDING: number;
    APPROVED: number;
    REJECTED: number;
}

export interface PaginatedVerificationsResponse {
    success: boolean;
    data: VerificationRequest[];
    message: string;
    meta: {
        requestId: string;
        timestamp: string;
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
        counts: VerificationsCounts;
    };
}

export interface SiteVerificationRequest extends VerificationRequest {
    siteId?: string;
    siteName?: string;
    siteReference?: string;
}

export interface PaginatedSiteVerificationsResponse extends Omit<PaginatedVerificationsResponse, 'data'> {
    data: SiteVerificationRequest[];
}

export const adminService = {
    /**
     * List user verification requests (landowner, operator, identity) with pagination and filtering
     */
    async listUserVerifications(params?: {
        status?: string;
        role?: string;
        page?: number;
        limit?: number;
    }): Promise<PaginatedVerificationsResponse> {
        return apiClient.get('/admin/v1/verifications/users', { params: params as any });
    },

    /**
     * List site verification requests with pagination and filtering
     */
    async listSiteVerifications(params?: {
        status?: string;
        page?: number;
        limit?: number;
    }): Promise<PaginatedSiteVerificationsResponse> {
        return apiClient.get('/admin/v1/verifications/sites', { params: params as any });
    },
    
    /**
     * Get a single verification request by ID
     */
    async getVerificationById(id: string): Promise<{ success: boolean; data: VerificationRequest; message: string }> {
        return apiClient.get(`/admin/v1/verifications/${id}`);
    },

    /**
     * Update a verification status (Approve/Reject)
     */
    async updateVerification(
        id: string, 
        status: 'APPROVED' | 'REJECTED', 
        adminNote?: string
    ): Promise<{ success: boolean; data: any; message: string }> {
        return apiClient.put(`/admin/v1/verifications/${id}`, { status, adminNote });
    }
};
