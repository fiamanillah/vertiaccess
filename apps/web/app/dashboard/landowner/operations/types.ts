import type { Booking as SharedBooking, BookingStatus } from '@/services/booking.types'

export type Booking = SharedBooking & {
  bookingVaId?: string
  bookingReference?: string
  siteType?: string
  siteCategory?: string
  siteStatusAtIssue?: string
  permittedActivities?: string[]
  operatorFlyerId?: string | null
  landownerName?: string | null
  landownerEmail?: string | null
  landownerPhone?: string | null
  landownerId?: string | null
  authorityDeclaration?: boolean
  isAutoApproved?: boolean
  platformName?: string | null
  certificateType?: string | null
  toalCost?: number | null
  cancellationFee?: number | null
  paymentStatus?: string | null
}

export interface BookingResponse {
  data: Booking[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrevious: boolean
  }
  counts: {
    pending: number
    upcoming: number
    past: number
  }
}
