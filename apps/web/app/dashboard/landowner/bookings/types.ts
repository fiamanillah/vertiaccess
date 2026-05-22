export type BookingStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED'

export interface Booking {
  id: string
  vaId: string
  bookingVaId: string
  siteId: string
  siteName: string
  siteAddress: string
  siteType: string
  siteCategory: string
  siteStatusAtIssue: string
  startTime: string
  endTime: string
  useCategory: string
  permittedActivities: string[]
  operatorName: string
  operatorEmail: string
  operatorOrganisation: string
  operatorFlyerId: string
  flyerId: string | null
  droneModel: string
  operationReference: string
  missionIntent: string
  landownerName: string
  landownerEmail: string
  landownerPhone: string
  landownerId: string
  authorityDeclaration: boolean
  isAutoApproved: boolean
  status: BookingStatus
  platformName: string
  certificateType: string
  createdAt: string
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
