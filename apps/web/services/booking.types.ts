/**
 * Shared types for the booking service layer.
 * Kept in sync with backend booking-query-service serialization.
 */

export type BookingStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'ACTIVATED'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'EXPIRED'
export type UseCategory = 'planned_toal' | 'emergency_recovery'
export type PaymentStatus =
  | 'pending'
  | 'authorized' // emergency: card on file, not yet charged
  | 'pending_charge' // charge in-flight
  | 'charged' // successfully charged
  | 'failed' // charge failed — account may be locked
  | 'cancelled_no_charge' // cancelled with no fee
  | 'cancelled_partial' // cancelled with partial fee
  | 'cancelled_full' // cancelled with full fee
  | 'refunded'

export interface Booking {
  id: string
  vaId: string | null
  bookingReference: string
  operatorId: string
  siteId: string
  siteName: string | null
  siteAddress: string | null
  siteCategory: string | null
  siteType: string | null
  sitePhotoUrl: string | null
  siteGeometry: unknown | null
  siteClzGeometry: unknown | null
  startTime: string
  endTime: string
  operationReference: string | null
  droneModel: string | null
  manufacturer: string | null
  airframe: string | null
  mtow: string | null
  operationType: 'INBOUND' | 'OUTBOUND' | null
  siteStatus: string | null
  siteVaId: string | null
  missionIntent: string | null
  useCategory: UseCategory
  flyerId: string | null
  isPayg: boolean
  toalCost: number | null
  platformFee: number | null
  cancellationFee: number | null
  paymentMethodLast4: string | null
  paymentMethodBrand: string | null
  status: BookingStatus
  paymentStatus: PaymentStatus | null
  clzUsed: boolean | null
  clzConfirmedAt: string | null
  // Emergency authorization capture
  emergencyAuthAmount: number | null
  emergencyAuthCardLast4: string | null
  emergencyAuthAgreedAt: string | null
  createdAt: string
  respondedAt: string | null
  cancelledAt: string | null
  // Operator info (from join)
  operatorName: string | null
  operatorEmail: string | null
  operatorPhone: string | null
  operatorOrganisation: string | null
  operatorReference: string | null
  operatorFlyerId: string | null
  // Certificate
  certificateVaId: string | null
  certificateId: string | null
  // AssetManager rejection note
  adminNote?: string
}

export type BookingLifecycleEventType =
  | 'BOOKING_CREATED'
  | 'BOOKING_APPROVED'
  | 'BOOKING_REJECTED'
  | 'BOOKING_CANCELLED'
  | 'PAYMENT_CHARGED'
  | 'PAYMENT_FAILED'
  | 'REFUND_INITIATED'
  | 'REFUND_COMPLETED'
  | 'EMERGENCY_USAGE_CONFIRMED'
  | 'EMERGENCY_NOT_USED'
  | 'CERTIFICATE_ISSUED'
  | (string & {})

export interface BookingLifecycleEvent {
  id: string
  bookingId: string
  eventType: BookingLifecycleEventType
  title: string
  description: string | null
  actorType: 'operator' | 'assetmanager' | 'admin' | 'system'
  actorId: string
  previousState: unknown | null
  newState: unknown | null
  metadata: Record<string, unknown> | null
  createdAt: string
}

export interface BookingTimelineResponse {
  bookingId: string
  events: BookingLifecycleEvent[]
}

export interface CreateBookingPayload {
  siteId: string
  startTime: string // ISO 8601
  endTime: string // ISO 8601
  droneModel: string
  manufacturer: string
  airframe: string
  mtow: string
  missionIntent: string
  useCategoType?: 'INBOUND' | 'OUTBOUND'
  operationry: UseCategory
  operationReference?: string
  flyerId?: string
  operatorPhone?: string
  emergencyAuthAgreed?: boolean // required for emergency_recovery
  paymentIntentId?: string
  billingMode?: 'payg' | 'subscription'
  paymentMethodId?: string
}

export interface AvailabilitySlotRaw {
  startTime: string
  endTime: string
  status: 'PENDING' | 'APPROVED'
  useCategory: UseCategory
}

export interface AvailabilityResponse {
  siteId: string
  siteName: string
  exclusiveUse: boolean
  activationStartTime: string // "08:00"
  activationEndTime: string // "20:00"
  existingBookings: AvailabilitySlotRaw[]
  slots: AvailabilitySlotRaw[] // alias kept for backwards compat
}

export interface PaymentMethod {
  id: string
  stripePaymentMethodId: string
  brand: string
  last4: string
  expiryMonth: number
  expiryYear: number
  isDefault: boolean
}

export interface BookingSubscriptionSummary {
  hasActiveSubscription: boolean
  status: string | null
  planId: string | null
  planName: string | null
  billingType: 'subscription' | 'payg' | null
  price: number | null
  currency: string | null
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
}

export interface BookingPricingBreakdown {
  billingMode: 'subscription' | 'payg'
  assetManagerFee: number
  platformFee: number
  totalDueNow: number
  authorizationAmount: number | null
  currency: string
}

export interface BookingCheckoutContext {
  siteId: string
  siteName: string
  siteAddress: string | null
  useCategory: UseCategory
  subscription: BookingSubscriptionSummary
  pricing: BookingPricingBreakdown
  paymentMethods: PaymentMethod[]
  defaultPaymentMethodId: string | null
  selectedPaymentMethodId: string | null
  requiresCard: boolean
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

export interface BookingCounts {
  pending: number
  upcoming: number
  past: number
  completed?: number
  denied?: number
}

export interface PaginatedBookingsResponse {
  success: boolean
  data: Booking[]
  message: string
  meta: {
    requestId: string
    timestamp: string
    pagination: PaginationMeta
    counts?: BookingCounts
    unresolvedEmergency?: Booking | null
  }
}

export interface ListMyBookingsParams {
  page?: number
  limit?: number
  query?: string
  search?: string
  status?: string
  useCategory?: string
  siteId?: string
  from?: string
  to?: string
  sort?: string
  sortOrder?: 'asc' | 'desc'
  date?: string
  bucket?: 'upcoming' | 'pending' | 'past' | 'completed' | 'denied'
}

export type CreateBookingResponse =
  | Booking
  | {
      requiresAction: true
      clientSecret: string
      bookingId: string
      status: 'PENDING_PAYMENT'
    }
