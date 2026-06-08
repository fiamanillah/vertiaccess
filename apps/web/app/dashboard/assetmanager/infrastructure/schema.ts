import * as z from 'zod'

// ─── Calendar day helper ─────────────────────────────────────────────────────

/** Count how many calendar days lie between `from` and `to`. */
function countCalendarDays(from: Date, to: Date): number {
  const start = new Date(from)
  start.setHours(0, 0, 0, 0)
  const end = new Date(to)
  end.setHours(0, 0, 0, 0)
  const diffTime = end.getTime() - start.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

function circleAreaM2(r: number) {
  return Math.PI * r * r
}

function polygonAreaM2(pts: [number, number][]): number {
  if (pts.length < 3) return 0
  const D = 111_320
  let area = 0
  for (let i = 0; i < pts.length; i++) {
    const [y1, x1] = pts[i]!
    const [y2, x2] = pts[(i + 1) % pts.length]!
    area += (x2 - x1) * Math.cos(((y1 + y2) / 2) * (Math.PI / 180)) * (y1 + y2)
  }
  return (Math.abs(area) * D * D) / 2
}

export const ACTIVATION_MIN_DAYS = 5

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
        return countCalendarDays(today, chosen) >= ACTIVATION_MIN_DAYS
      },
      {
        message: `Activation must start at least ${ACTIVATION_MIN_DAYS} days from today to allow time for review.`,
      },
    ),
  activationStartTime: z.string().optional(),
  activationEndDate: z.string().optional(),
  activationEndTime: z.string().optional(),
  isPermanentActivation: z.boolean(),
  bookingApprovalModel: z.enum(['auto', 'manual']),
  policyDocuments: z.array(uploadedFileMetadataSchema).optional(),

  // Stage 4: Commercial Setup
  toalFee: z.number().optional(),
  emergencyFee: z.number().optional(),

  // Stage 5: Proof of Authority
  ownershipDocuments: z
    .array(uploadedFileMetadataSchema)
    .min(1, 'Please upload at least one proof of ownership.'),
  legalDeclaration: z.boolean().refine((val) => val === true, {
    message:
      'You must declare that you have the legal authority to register this site.',
  }),
}).superRefine((data, ctx) => {
  // Step 2: Polygon validations
  if (data.toalGeometryMode === 'polygon') {
    if (!data.toalPolygonPoints || data.toalPolygonPoints.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['toalPolygonPoints'],
        message: 'Please draw a TOAL polygon with at least 3 points on the map.',
      })
    }
  }

  if (data.allowEmergencyLanding && data.emergencyGeometryMode === 'polygon') {
    if (!data.emergencyPolygonPoints || data.emergencyPolygonPoints.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['emergencyPolygonPoints'],
        message: 'Please draw an emergency polygon with at least 3 points on the map.',
      })
    }
  }

  // Emergency vs TOAL area comparison
  if (data.siteType !== 'emergency' && data.allowEmergencyLanding) {
    const toalArea = data.toalGeometryMode === 'polygon'
      ? polygonAreaM2(data.toalPolygonPoints || [])
      : circleAreaM2(data.toalRadius ?? 100)

    const emergencyArea = data.emergencyGeometryMode === 'polygon'
      ? polygonAreaM2(data.emergencyPolygonPoints || [])
      : circleAreaM2(data.emergencyRadius ?? 350)

    if (emergencyArea < toalArea) {
      const path = data.emergencyGeometryMode === 'polygon' ? 'emergencyPolygonPoints' : 'emergencyRadius'
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [path],
        message: 'Emergency & Recovery zone area cannot be smaller than the TOAL zone area.',
      })
    }
  }

  // Step 3: Temporary activation validation
  if (!data.isPermanentActivation) {
    if (!data.activationStartDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['activationStartDate'],
        message: 'Start date is required.',
      })
    }
    if (!data.activationEndDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['activationEndDate'],
        message: 'End date is required.',
      })
    }
    if (data.activationStartDate && data.activationEndDate) {
      const start = new Date(data.activationStartDate)
      const end = new Date(data.activationEndDate)
      if (end < start) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['activationEndDate'],
          message: 'End date cannot be before start date.',
        })
      }
    }
  }

  // Step 4: Fees validations
  if (data.siteType !== 'emergency') {
    if (data.toalFee === undefined || data.toalFee === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['toalFee'],
        message: 'TOAL access fee is required.',
      })
    } else if (data.toalFee < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['toalFee'],
        message: 'Fee must be at least 0.',
      })
    }
  }

  const hasEmergency = data.siteType === 'emergency' || !!data.allowEmergencyLanding
  if (hasEmergency) {
    if (data.emergencyFee === undefined || data.emergencyFee === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['emergencyFee'],
        message: 'Emergency and recovery access fee is required.',
      })
    } else if (data.emergencyFee < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['emergencyFee'],
        message: 'Fee must be at least 0.',
      })
    }
  }
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
