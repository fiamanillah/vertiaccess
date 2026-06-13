import { apiClient } from './api-client'

export interface VerificationRequest {
  id: string
  type: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  userId: string
  userVaId?: string | null
  userEmail: string
  userName: string
  userOrganisation: string
  userRole: string
  flyerId: string | null
  submittedDocuments: any[] | null
  createdAt: string
  reviewedAt: string | null
  accountStatus?: string | null
}

export interface VerificationsCounts {
  PENDING: number
  APPROVED: number
  REJECTED: number
}

export interface PaginatedVerificationsResponse {
  success: boolean
  data: VerificationRequest[]
  message: string
  meta: {
    requestId: string
    timestamp: string
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
      hasNext: boolean
      hasPrevious: boolean
    }
    counts: VerificationsCounts
  }
}

export interface SiteVerificationRequest extends VerificationRequest {
  siteId?: string
  siteName?: string
  siteReference?: string
}

export interface PaginatedSiteVerificationsResponse extends Omit<
  PaginatedVerificationsResponse,
  'data'
> {
  data: SiteVerificationRequest[]
}

export interface AdminUser {
  id: string
  email: string
  role: 'admin' | 'operator' | 'assetmanager'
  firstName: string
  lastName: string
  displayName: string
  status: 'active' | 'inactive' | 'suspended' | 'pending_verification' | 'payment_locked'
  organisation?: string
  lastLogin?: string | null
  createdAt: string
  updatedAt: string
}

export interface AdminStatsResponse {
  pendingActions: {
    pendingAssetManagers: number;
    pendingOperators: number;
    pendingAssetReviews: number;
  };
  networkComposition: {
    assetManagers: number;
    droneOperators: number;
    activeAssets: number;
  };
  networkRequest: {
    submitted: number;
    approved: number;
    rejected: number;
  };
  recentRegistrations: {
    newAssetManagers30d: number;
    newOperators30d: number;
    newSites30d: number;
  };
  revenue: {
    totalRevenue: number;
    subscriptionRevenue: number;
    bookingRevenue: number;
    revenueTrend: Array<{
      month: string;
      total: number;
      subscription: number;
      booking: number;
    }>;
  };
}

export interface PaginatedUsersResponse {
  success: boolean
  data: AdminUser[]
  message: string
  meta: {
    requestId: string
    timestamp: string
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
      hasNext: boolean
      hasPrevious: boolean
    }
  }
}

export const adminService = {
  /**
   * Get overall admin statistics
   */
  async getStats(): Promise<{ success: boolean; data: AdminStatsResponse; message: string }> {
    return apiClient.get('/admin/v1/stats')
  },

  /**
   * Get admin analytics data
   */
  async getAnalytics(): Promise<{ success: boolean; data: any; message: string }> {
    return apiClient.get('/admin/v1/analytics')
  },

  /**
   * List all users with pagination, sorting and search
   */
  async listUsers(params?: {
    search?: string
    sort?: string
    sortOrder?: 'asc' | 'desc'
    page?: number
    limit?: number
  }): Promise<PaginatedUsersResponse> {
    return apiClient.get('/admin/v1/users', {
      params: params as any,
    })
  },

  /**
   * List user verification requests (assetmanager, operator, identity) with pagination and filtering
   */
  async listUserVerifications(params?: {
    status?: string
    role?: string
    page?: number
    limit?: number
  }): Promise<PaginatedVerificationsResponse> {
    return apiClient.get('/admin/v1/verifications/users', {
      params: params as any,
    })
  },

  /**
   * List site verification requests with pagination and filtering
   */
  async listSiteVerifications(params?: {
    status?: string
    query?: string
    page?: number
    limit?: number
  }): Promise<PaginatedSiteVerificationsResponse> {
    return apiClient.get('/admin/v1/verifications/sites', {
      params: params as any,
    })
  },

  /**
   * Get a single verification request by ID
   */
  async getVerificationById(
    id: string,
  ): Promise<{ success: boolean; data: VerificationRequest; message: string }> {
    return apiClient.get(`/admin/v1/verifications/${id}`)
  },

  /**
   * Update a verification status (Approve/Reject)
   */
  async updateVerification(
    id: string,
    status: 'APPROVED' | 'REJECTED',
    adminNote?: string,
  ): Promise<{ success: boolean; data: any; message: string }> {
    return apiClient.put(`/admin/v1/verifications/${id}`, { status, adminNote })
  },

  /**
   * Fetch detailed user information
   */
  async getUser(id: string): Promise<{ success: boolean; data: any; message: string }> {
    return apiClient.get(`/admin/v1/users/${id}`)
  },

  /**
   * Update user role (admin/operator/assetmanager)
   */
  async updateUserRole(id: string, role: string): Promise<{ success: boolean; data: any; message: string }> {
    return apiClient.put(`/admin/v1/users/${id}/role`, { role })
  },

  /**
   * Suspend user account
   */
  async suspendUser(id: string, reason: string, durationDays?: number): Promise<{ success: boolean; data: any; message: string }> {
    return apiClient.post(`/admin/v1/users/${id}/suspend`, { reason, durationDays })
  },

  /**
   * Reinstate suspended user account
   */
  async reinstateUser(id: string): Promise<{ success: boolean; data: any; message: string }> {
    return apiClient.post(`/admin/v1/users/${id}/reinstate`, {})
  },

  /**
   * Delete user account (soft delete)
   */
  async deleteUser(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete(`/admin/v1/users/${id}`)
  },

  /**
   * Permanently ban user account
   */
  async banUser(id: string, reason: string): Promise<{ success: boolean; data: any; message: string }> {
    return apiClient.post(`/admin/v1/users/${id}/ban`, { reason })
  },

  /**
   * Lock user account due to payment issues
   */
  async paymentLockUser(id: string, reason: string, bookingId?: string): Promise<{ success: boolean; data: any; message: string }> {
    return apiClient.post(`/admin/v1/users/${id}/payment-lock`, { reason, bookingId })
  },

  /**
   * Create a new user (admin/operator/assetmanager)
   */
  async createUser(data: any): Promise<{ success: boolean; data: any; message: string }> {
    return apiClient.post('/admin/v1/users', data)
  },

  /**
   * Update user account status manually
   */
  async updateUserStatus(id: string, status: string): Promise<{ success: boolean; data: any; message: string }> {
    return apiClient.put(`/admin/v1/users/${id}/status`, { status })
  },
}
