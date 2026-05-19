import { apiClient } from './api-client'

export interface CreateSiteDto {
  name: string
  description?: string
  siteType?: 'toal' | 'emergency'
  siteCategory?: 'private_land' | 'helipad' | 'vertiport' | 'droneport' | 'temporary_landing_site'
  address: string
  postcode: string
  contactEmail: string
  contactPhone: string
  geometry: {
    type: 'circle' | 'polygon'
    center?: { lat: number; lng: number }
    radius?: number
    points?: { lat: number; lng: number }[]
    heightAGL?: number
  }
  clzGeometry?: {
    type: 'circle' | 'polygon'
    center?: { lat: number; lng: number }
    radius?: number
    points?: { lat: number; lng: number }[]
    heightAGL?: number
  }
  validityStart: string
  validityEnd?: string | null
  autoApprove?: boolean
  exclusiveUse?: boolean
  emergencyRecoveryEnabled?: boolean
  clzEnabled?: boolean
  toalAccessFee?: number
  clzAccessFee?: number
  hourlyRate?: number
  cancellationFeePercentage?: number
  documents?: {
    fileKey: string
    fileName: string
    fileSize?: string
    documentType?: 'policy' | 'ownership' | 'photo'
  }[]
  siteInformation?: string
  policyDocument?: string
  authorizedToGrantAccess?: boolean
  acceptedLandownerDeclaration?: boolean
}

export const siteService = {
  /**
   * Create a new landowner site
   */
  async createSite(data: CreateSiteDto): Promise<{ success: boolean; data: any; message: string }> {
    return apiClient.post('/sites/v1/', data)
  },

  /**
   * List all sites registered by/visible to the landowner
   */
  async listSites(): Promise<{ success: boolean; data: any[]; message: string }> {
    return apiClient.get('/sites/v1/')
  },

  /**
   * Get a single site's details by ID (Landowner)
   */
  async getSite(siteId: string): Promise<{ success: boolean; data: any; message: string }> {
    return apiClient.get(`/sites/v1/${siteId}`)
  },

  /**
   * Get a public site's details by ID (Operator Discovery)
   */
  async getPublicSite(siteId: string): Promise<{ success: boolean; data: any; message: string }> {
    return apiClient.get(`/sites/v1/public/${siteId}`)
  },

  /**
   * Update site details
   */
  async updateSite(
    siteId: string,
    data: Partial<CreateSiteDto>
  ): Promise<{ success: boolean; data: any; message: string }> {
    return apiClient.patch(`/sites/v1/${siteId}`, data)
  },

  /**
   * Delete/archive a site
   */
  async deleteSite(siteId: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete(`/sites/v1/${siteId}`)
  },

  /**
   * Search public active sites (for discovery map)
   */
  async searchPublicSites(
    params?: {
      q?: string
      siteType?: string
      autoApprove?: string
      maxPrice?: string
      lat?: string
      lng?: string
      radius?: string
      page?: number
      limit?: number
    }
  ): Promise<{
    success: boolean
    data: any[]
    message: string
    meta: {
      pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
        hasNext: boolean
        hasPrevious: boolean
      }
    }
  }> {
    return apiClient.get('/sites/v1/public', {
      params: params as any,
    })
  },
}
