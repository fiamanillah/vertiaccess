import type { Booking as SharedBooking, BookingStatus } from '@/services/booking.types'

export type Booking = SharedBooking & {
  bookingVaId?: string
  bookingReference?: string
  siteStatusAtIssue?: string
  permittedActivities?: string[]
  operatorFlyerId?: string | null
  assetManagerName?: string | null
  assetManagerEmail?: string | null
  assetManagerPhone?: string | null
  assetManagerId?: string | null
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
    completed?: number
    denied?: number
  }
}
