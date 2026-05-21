import { apiClient } from './api-client'
import type {
  Booking,
  ConsentCertificate,
  CreateBookingPayload,
  AvailabilityResponse,
} from './booking.types'

class BookingService {
  private readonly WRITE_PATH = '/bookings/v1'
  private readonly QUERY_PATH = '/booking-queries/v1'

  // ─── Availability ─────────────────────────────────────────────────────────

  /**
   * Fetch availability for a site on a specific date.
   * Returns activation hours and all existing bookings that day.
   * Public — no auth required.
   */
  async getAvailability(
    siteId: string,
    date: string,
  ): Promise<AvailabilityResponse> {
    const response = await apiClient.get<{ data: AvailabilityResponse }>(
      `${this.QUERY_PATH}/availability/${siteId}`,
      {
        params: { date },
        token: null, // Public endpoint
      },
    )
    return response.data
  }

  // ─── Booking CRUD ─────────────────────────────────────────────────────────

  /**
   * Create a new booking.
   * For emergency_recovery: must include emergencyAuthAgreed: true.
   */
  async createBooking(payload: CreateBookingPayload): Promise<Booking> {
    const response = await apiClient.post<{ data: Booking }>(
      `${this.WRITE_PATH}`,
      payload,
    )
    return response.data
  }

  /**
   * List the authenticated operator's own bookings.
   */
  async listMyBookings(): Promise<Booking[]> {
    const response = await apiClient.get<{ data: Booking[] }>(
      `${this.QUERY_PATH}/mine`,
    )
    return response.data
  }

  /**
   * Fetch a single booking by ID.
   */
  async getBooking(bookingId: string): Promise<Booking> {
    const response = await apiClient.get<{ data: Booking }>(
      `${this.QUERY_PATH}/${bookingId}`,
    )
    return response.data
  }

  /**
   * Fetch the approved booking's consent certificate payload.
   */
  async getBookingCertificate(bookingId: string): Promise<ConsentCertificate> {
    const response = await apiClient.get<{ data: ConsentCertificate }>(
      `${this.QUERY_PATH}/${bookingId}/certificate`,
    )
    return response.data
  }

  /**
   * Confirm or deny emergency site usage after the booking window.
   * On used=true: triggers the off-session charge.
   * On used=false: releases with no charge.
   */
  async confirmEmergencyUsage(
    bookingId: string,
    used: boolean,
  ): Promise<Booking> {
    const response = await apiClient.patch<{ data: Booking }>(
      `${this.WRITE_PATH}/${bookingId}/emergency-usage`,
      { clzUsed: used },
    )
    return response.data
  }

  /**
   * Cancel a booking.
   * Only allowed before the start time; a cancellation fee may apply.
   */
  async cancelBooking(bookingId: string): Promise<Booking> {
    const response = await apiClient.patch<{ data: Booking }>(
      `${this.WRITE_PATH}/${bookingId}/status`,
      { status: 'CANCELLED' },
    )
    return response.data
  }
}

export const bookingService = new BookingService()
