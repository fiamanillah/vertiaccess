import { apiClient } from './api-client'
import type {
  CreateIncidentDecisionPayload,
  CreateIncidentMessagePayload,
  CreateIncidentPayload,
  IncidentRecordDto,
  IncidentSingleResponse,
} from './incident.types'

class IncidentService {
  private readonly WRITE_PATH = '/incidents/v1'

  async createIncident(payload: CreateIncidentPayload): Promise<IncidentRecordDto> {
    const endpoint = payload.bookingId
      ? `${this.WRITE_PATH}/bookings/${payload.bookingId}/incidents`
      : this.WRITE_PATH

    const response = await apiClient.post<IncidentSingleResponse>(endpoint, payload)
    return response.data
  }

  async addIncidentMessage(
    incidentId: string,
    payload: CreateIncidentMessagePayload,
  ): Promise<IncidentRecordDto> {
    const response = await apiClient.post<IncidentSingleResponse>(
      `${this.WRITE_PATH}/${incidentId}/messages`,
      payload,
    )
    return response.data
  }

  async addIncidentDocument(
    incidentId: string,
    payload: {
      fileName: string
      documentType: string
      fileSize?: string
      fileKey?: string
    },
  ): Promise<IncidentRecordDto> {
    const response = await apiClient.post<IncidentSingleResponse>(
      `${this.WRITE_PATH}/${incidentId}/documents`,
      payload,
    )
    return response.data
  }

  async updateIncidentStatus(
    incidentId: string,
    payload: { status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED'; adminNotes?: string },
  ): Promise<IncidentRecordDto> {
    const response = await apiClient.patch<IncidentSingleResponse>(
      `${this.WRITE_PATH}/${incidentId}/status`,
      payload,
    )
    return response.data
  }

  async updateIncidentAdminNotes(
    incidentId: string,
    adminNotes: string | null,
  ): Promise<IncidentRecordDto> {
    const response = await apiClient.patch<IncidentSingleResponse>(
      `${this.WRITE_PATH}/${incidentId}/notes`,
      { adminNotes },
    )
    return response.data
  }

  async recordDecision(
    incidentId: string,
    payload: CreateIncidentDecisionPayload,
  ): Promise<IncidentRecordDto> {
    const response = await apiClient.post<IncidentSingleResponse>(
      `${this.WRITE_PATH}/${incidentId}/decision`,
      payload,
    )
    return response.data
  }
}

export const incidentService = new IncidentService()
