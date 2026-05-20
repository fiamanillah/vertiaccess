import { apiClient } from './api-client';

export interface SubmitAppealRequest {
    reason: string;
}

export interface SubmitAppealResponse {
    success: boolean;
    message: string;
}

class AppealService {
    async submitAppeal(data: SubmitAppealRequest): Promise<SubmitAppealResponse> {
        try {
            const response = await apiClient.post<SubmitAppealResponse>('/users/v1/appeal', data);
            return response;
        } catch (error: any) {
            throw error.response?.data || { success: false, message: 'Failed to submit appeal' };
        }
    }
}

export const appealService = new AppealService();
