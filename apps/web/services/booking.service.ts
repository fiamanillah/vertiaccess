import { apiClient } from './api-client'
import type {
  Booking,
  ConsentCertificate,
  CreateBookingPayload,
  AvailabilityResponse,
  BookingCheckoutContext,
  BookingTimelineResponse,
  ListMyBookingsParams,
  PaginatedBookingsResponse,
  CreateBookingResponse,
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
  async createBooking(payload: CreateBookingPayload): Promise<CreateBookingResponse> {
    const response = await apiClient.post<{ data: CreateBookingResponse }>(
      `${this.WRITE_PATH}`,
      payload,
    )
    return response.data
  }

  /**
   * Confirm booking payment after 3D Secure authentication.
   */
  async confirmBookingPayment(bookingId: string, paymentIntentId: string): Promise<Booking> {
    const response = await apiClient.post<{ data: Booking }>(
      `${this.WRITE_PATH}/${bookingId}/confirm-payment`,
      { paymentIntentId },
    )
    return response.data
  }

  /**
   * List the authenticated operator's own bookings.
   */
  async listMyBookings(params: ListMyBookingsParams = {}): Promise<Booking[]> {
    const queryParams: Record<string, string> = {}

    if (params.status && params.status !== 'all') {
      queryParams.status = params.status
    }

    if (params.useCategory && params.useCategory !== 'all') {
      queryParams.useCategory = params.useCategory
    }

    const response = await apiClient.get<{ data: Booking[] }>(
      `${this.QUERY_PATH}/mine`,
      { params: queryParams },
    )
    return response.data
  }

  /**
   * List bookings visible to a landowner with pagination and filters.
   */
  async listLandownerBookings(
    params: ListMyBookingsParams = {},
  ): Promise<PaginatedBookingsResponse> {
    const queryParams: Record<string, string> = {}

    if (typeof params.page === 'number') {
      queryParams.page = String(params.page)
    }

    if (typeof params.limit === 'number') {
      queryParams.limit = String(params.limit)
    }

    if (params.siteId) {
      queryParams.siteId = params.siteId
    }

    if (params.status && params.status !== 'all') {
      queryParams.status = params.status
    }

    if (params.useCategory && params.useCategory !== 'all') {
      queryParams.useCategory = params.useCategory
    }

    if (params.search ?? params.query) {
      queryParams.search = params.search ?? params.query ?? ''
    }

    if (params.bucket) {
      queryParams.bucket = params.bucket
    }

    if (params.date) {
      queryParams.date = params.date
    }

    const response = await apiClient.get<PaginatedBookingsResponse>(
      `${this.QUERY_PATH}/landowner`,
      { params: queryParams },
    )

    return response
  }

  /**
   * Approve or reject a booking on behalf of a landowner.
   */
  async updateBookingStatus(
    bookingId: string,
    status: 'APPROVED' | 'REJECTED' | 'CANCELLED',
    adminNote?: string,
  ): Promise<Booking> {
    const response = await apiClient.patch<{ data: Booking }>(
      `${this.WRITE_PATH}/${bookingId}/status`,
      {
        status,
        ...(adminNote ? { adminNote } : {}),
      },
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
   * Fetch the lifecycle timeline for a booking.
   */
  async getBookingTimeline(
    bookingId: string,
  ): Promise<BookingTimelineResponse> {
    const response = await apiClient.get<{ data: BookingTimelineResponse }>(
      `${this.QUERY_PATH}/${bookingId}/timeline`,
    )
    return response.data
  }

  /**
   * Fetch booking checkout context for a site and operation type.
   */
  async getCheckoutContext(
    siteId: string,
    useCategory: 'planned_toal' | 'emergency_recovery',
  ): Promise<BookingCheckoutContext> {
    const response = await apiClient.get<{ data: BookingCheckoutContext }>(
      `${this.WRITE_PATH}/checkout/${siteId}`,
      {
        params: { useCategory },
      },
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
      { used },
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
