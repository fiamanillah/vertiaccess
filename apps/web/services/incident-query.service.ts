import { apiClient } from './api-client'
import {
  mapIncidentListToTickets,
  mapIncidentToTicket,
  type IncidentListResponse,
  type IncidentRecordDto,
  type IncidentSingleResponse,
} from './incident.types'
import type { Ticket } from '@/app/dashboard/components/incident-report/types'

class IncidentQueryService {
  private readonly QUERY_PATH = '/incident-queries/v1'

  async listIncidents(): Promise<Ticket[]> {
    const response = await apiClient.get<IncidentListResponse>(`${this.QUERY_PATH}`)
    return mapIncidentListToTickets(response.data)
  }

  async listMyIncidents(): Promise<Ticket[]> {
    const response = await apiClient.get<IncidentListResponse>(`${this.QUERY_PATH}/mine`)
    return mapIncidentListToTickets(response.data)
  }

  async listSiteIncidents(siteId: string): Promise<Ticket[]> {
    const response = await apiClient.get<IncidentListResponse>(
      `${this.QUERY_PATH}/site/${siteId}`,
    )
    return mapIncidentListToTickets(response.data)
  }

  async listBookingIncidents(bookingId: string): Promise<Ticket[]> {
    const response = await apiClient.get<IncidentListResponse>(
      `${this.QUERY_PATH}/booking/${bookingId}`,
    )
    return mapIncidentListToTickets(response.data)
  }

  async getIncident(incidentId: string): Promise<Ticket> {
    const response = await apiClient.get<IncidentSingleResponse>(
      `${this.QUERY_PATH}/${incidentId}`,
    )
    return mapIncidentToTicket(response.data)
  }

  async getBookingIncident(bookingId: string): Promise<Ticket | null> {
    const tickets = await this.listBookingIncidents(bookingId)
    return tickets[0] ?? null
  }
}

export const incidentQueryService = new IncidentQueryService()
