/**
 * Shared types for the booking service layer.
 * Kept in sync with backend booking-query-service serialization.
 */

export type BookingStatus =
  | 'PENDING'
  | 'APPROVED'
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
  sitePhotoUrl: string | null
  siteGeometry: unknown | null
  siteClzGeometry: unknown | null
  startTime: string
  endTime: string
  operationReference: string | null
  droneModel: string | null
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
  operatorOrganisation: string | null
  // Certificate
  certificateVaId: string | null
  certificateId: string | null
  // Landowner rejection note
  adminNote?: string
}

export interface ConsentCertificate {
  id: string
  vaId: string
  certificateType: string
  issueDate: string
  platformName: string
  verificationUrl: string
  verificationHash: string
  digitalSignature: string
  siteStatusAtIssue: string
  landownerName: string
  landownerEmail: string
  landownerPhone: string
  authorityDeclaration: boolean
  siteId: string
  siteName: string
  siteType: string
  siteAddress: string
  siteGeometry: unknown | null
  clzGeometry: unknown | null
  siteGeometrySize: string
  siteCoordinates: string
  operatorName: string
  operatorOrganisation: string | null
  operatorEmail: string
  operationReference: string
  flyerId: string | null
  droneModel: string
  missionIntent: string
  startTime: string
  endTime: string
  permittedActivities: string[]
  useCategory: UseCategory
  exclusiveUse: boolean
  autoApprovalEnabled: boolean
  consentStatus: BookingStatus | 'PENDING'
  createdAt: string
  bookingId: string
  bookingVaId: string
}

export interface CreateBookingPayload {
  siteId: string
  startTime: string // ISO 8601
  endTime: string // ISO 8601
  droneModel: string
  missionIntent: string
  useCategory: UseCategory
  operationReference?: string
  flyerId?: string
  emergencyAuthAgreed?: boolean // required for emergency_recovery
  paymentIntentId?: string
  billingMode?: 'payg' | 'subscription'
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
