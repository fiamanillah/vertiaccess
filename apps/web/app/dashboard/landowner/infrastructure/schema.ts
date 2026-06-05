import * as z from 'zod'

// ─── Working day helper ───────────────────────────────────────────────────────

/** Count how many Mon–Fri calendar days lie between `from` (today, exclusive) and `to` (inclusive). */
function countWorkingDays(from: Date, to: Date): number {
  let count = 0
  const cursor = new Date(from)
  cursor.setHours(0, 0, 0, 0)
  cursor.setDate(cursor.getDate() + 1) // start counting from tomorrow
  const end = new Date(to)
  end.setHours(23, 59, 59, 999)
  while (cursor <= end) {
    const dow = cursor.getDay()
    if (dow !== 0 && dow !== 6) count++
    cursor.setDate(cursor.getDate() + 1)
  }
  return count
}

export const ACTIVATION_MIN_WORKING_DAYS = 5

export const uploadedFileMetadataSchema = z.object({
  fileKey: z.string(),
  fileName: z.string(),
  fileSize: z.number(),
  category: z.string(),
  url: z.string(),
})

export type UploadedFileMetadata = z.infer<typeof uploadedFileMetadataSchema>

export const formSchema = z.object({
  // Stage 1: Site Details
  name: z.string().min(2, 'Site name must be at least 2 characters.'),
  category: z.string().min(1, 'Please select a site category.'),
  siteType: z.string().min(1, 'Please select a primary function.'),
  description: z.string().optional(),
  photoUrls: z.array(uploadedFileMetadataSchema).optional(),
  contactEmail: z.string().email('Please enter a valid email address.'),
  contactPhone: z
    .string()
    .min(10, 'Please enter a valid contact phone number.'),

  // Stage 2: Location
  address: z.string().min(5, 'Please enter a full address.'),
  postcode: z.string().min(3, 'Please enter a valid postcode.'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  // TOAL boundary
  toalGeometryMode: z.enum(['circle', 'polygon']).optional(),
  toalRadius: z.number().optional(),
  toalPolygonPoints: z.array(z.tuple([z.number(), z.number()])).optional(),
  toalAreaM2: z.number().optional(),
  // Emergency boundary
  allowEmergencyLanding: z.boolean().optional(),
  emergencyGeometryMode: z.enum(['circle', 'polygon']).optional(),
  emergencyRadius: z.number().optional(),
  emergencyPolygonPoints: z.array(z.tuple([z.number(), z.number()])).optional(),
  emergencyAreaM2: z.number().optional(),

  // Stage 3: Operational Policy
  activationStartDate: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true // optional — no date = no validation
        const chosen = new Date(val)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return countWorkingDays(today, chosen) >= ACTIVATION_MIN_WORKING_DAYS
      },
      {
        message: `Activation must start at least ${ACTIVATION_MIN_WORKING_DAYS} working days from today to allow time for review.`,
      },
    ),
  activationStartTime: z.string().optional(),
  activationEndDate: z.string().optional(),
  activationEndTime: z.string().optional(),
  isPermanentActivation: z.boolean(),
  bookingApprovalModel: z.enum(['auto', 'manual']),
  policyDocuments: z.array(uploadedFileMetadataSchema).optional(),

  // Stage 4: Commercial Setup
  toalFee: z.number().min(0, 'Fee must be at least 0.'),
  emergencyFee: z.number().min(0, 'Fee must be at least 0.'),

  // Stage 5: Proof of Authority
  ownershipDocuments: z
    .array(uploadedFileMetadataSchema)
    .min(1, 'Please upload at least one proof of ownership.'),
  legalDeclaration: z.boolean().refine((val) => val === true, {
    message:
      'You must declare that you have the legal authority to register this site.',
  }),
})

export type FormValues = z.infer<typeof formSchema>

export type DetailedSite = {
  id: string
  vaId?: string
  name: string
  category: string
  siteType: 'toal' | 'emergency'
  address: string
  postcode: string
  latitude: number
  longitude: number
  toalRadius: number
  toalGeometryMode: 'circle' | 'polygon'
  toalPolygonPoints: [number, number][]
  allowEmergencyLanding: boolean
  emergencyRadius?: number
  emergencyGeometryMode?: 'circle' | 'polygon'
  emergencyPolygonPoints?: [number, number][]
  contactEmail: string
  contactPhone: string
  description: string
  photoUrls: UploadedFileMetadata[]
  isPermanentActivation: boolean
  activationStartDate?: string
  activationEndDate?: string
  activationStartTime?: string
  activationEndTime?: string
  bookingApprovalModel: 'auto' | 'manual'
  policyDocuments: UploadedFileMetadata[]
  ownershipDocuments?: UploadedFileMetadata[]
  toalFee: number
  emergencyFee: number
  status:
    | 'active'
    | 'pending'
    | 'rejected'
    | 'disabled'
    | 'temporary_unavailable'
  createdAt: string
  submissionDate?: string
  approvalDate?: string
  rejectionDate?: string
  reason?: string
}

export type SiteStats = {
  operationsThisMonth: number
  approvedRequests: number
  pendingRequests: number
  rejectedRequests: number
  totalToalOperations: number
  emergencyRecoveries: number
  revenueThisMonth: number
}
