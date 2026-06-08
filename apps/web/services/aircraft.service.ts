import { apiClient } from './api-client'

export interface AircraftDto {
  id?: string
  name: string
  droneModel: string
  manufacturer: string
  airframe: 'Fixed-Wing' | 'Rotary' | 'Hybrid' | 'Fixed-Wing, Rotary or Hybrid'
  mtow: string
  serialNumber?: string | null
  registrationNumber?: string | null
  createdAt?: string
  updatedAt?: string
}

export const aircraftService = {
  /**
   * Get all aircraft for the logged-in operator user
   */
  async listAircrafts(): Promise<{
    success: boolean
    data: AircraftDto[]
    message: string
  }> {
    return apiClient.get('/users/v1/me/aircrafts')
  },

  /**
   * Get a single aircraft's details by ID
   */
  async getAircraft(
    id: string,
  ): Promise<{ success: boolean; data: AircraftDto; message: string }> {
    return apiClient.get(`/users/v1/me/aircrafts/${id}`)
  },

  /**
   * Create a new aircraft
   */
  async createAircraft(
    data: AircraftDto,
  ): Promise<{ success: boolean; data: AircraftDto; message: string }> {
    return apiClient.post('/users/v1/me/aircrafts', data)
  },

  /**
   * Update details of an existing aircraft
   */
  async updateAircraft(
    id: string,
    data: Partial<AircraftDto>,
  ): Promise<{ success: boolean; data: AircraftDto; message: string }> {
    return apiClient.patch(`/users/v1/me/aircrafts/${id}`, data)
  },

  /**
   * Delete an aircraft
   */
  async deleteAircraft(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    return apiClient.delete(`/users/v1/me/aircrafts/${id}`)
  },
}
