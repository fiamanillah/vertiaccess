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

let activeVerificationsRequest: Promise<{ success: boolean; data: VerificationRequest[]; message: string }> | null = null;

export const adminService = {
    /**
     * List all verification requests
     * Deduplicates concurrent requests to prevent double API calls
     */
    async listVerifications(): Promise<{ success: boolean; data: VerificationRequest[]; message: string }> {
        if (activeVerificationsRequest) {
            return activeVerificationsRequest;
        }

        activeVerificationsRequest = apiClient.get('/admin/v1/verifications');

        try {
            const result = await activeVerificationsRequest;
            return result;
        } finally {
            // Clear the active request tracker after completion
            // Use a tiny delay to ensure rapid consecutive calls are caught
            setTimeout(() => {
                activeVerificationsRequest = null;
            }, 100);
        }
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
