import { z } from 'zod'

export const incidentTypeSchema = z.enum([
  'aircraft_incident',
  'infrastructure_incident',
  'safety_incident',
  'property_damage',
  'near_miss',
  'injury',
  'environmental',
  'unapproved_flight',
  'policy_non_compliance',
  'privacy_complaint',
  'refund',
  'other',
])

export const createIncidentSchema = z.object({
  siteId: z.string().min(1, 'Site ID is required').optional(),
  bookingId: z
    .string()
    .min(1, 'Booking ID is required for booking-linked reports')
    .optional(),
  clientRequestId: z.string().min(1).optional(),
  type: incidentTypeSchema,
  urgency: z.enum(['low', 'medium', 'high', 'critical']).default('high'),
  description: z.string().min(1, 'Description is required'),
  incidentDateTime: z.string().optional().nullable(),
  insuranceNotified: z.boolean().optional(),
  immediateActionTaken: z.string().optional().nullable(),
  estimatedDamage: z.number().optional().nullable(),
  impactAssessment: z.array(z.string()).optional().nullable(),
  status: z.enum(['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED']).optional(),
  attachments: z
    .array(
      z.object({
        fileName: z.string().min(1, 'File name is required'),
        documentType: z
          .string()
          .min(1, 'Document type is required')
          .default('evidence'),
        fileSize: z.string().optional(),
        fileKey: z.string().optional(),
      }),
    )
    .optional(),
})

export const incidentMessageVisibilitySchema = z.enum([
  'reporter',
  'target',
  'internal',
])

export const updateIncidentStatusSchema = z.object({
  status: z.enum(['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED']),
  urgency: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  adminNotes: z.string().optional(),
})

export const createIncidentMessageSchema = z.object({
  messageText: z.string().min(1, 'Message text is required'),
  visibility: incidentMessageVisibilitySchema.default('reporter'),
  attachments: z
    .array(
      z.object({
        fileName: z.string().min(1, 'File name is required'),
        documentType: z
          .string()
          .min(1, 'Document type is required')
          .default('evidence'),
        fileSize: z.string().optional(),
        fileKey: z.string().optional(),
      }),
    )
    .optional(),
})

export const incidentDecisionActionSchema = z.enum([
  'no_action',
  'temporary_suspend',
  'ban',
])

export const createIncidentDecisionSchema = z.object({
  decisionAction: incidentDecisionActionSchema,
  decisionReason: z.string().min(1, 'Decision reason is required'),
  decisionTargetId: z
    .string()
    .min(1, 'Decision target is required')
    .optional()
    .nullable(),
  decisionTargetRole: z.enum(['operator', 'assetmanager']).optional().nullable(),
  decisionDurationDays: z.number().int().positive().optional().nullable(),
})

export const createIncidentDocumentSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  documentType: z.string().min(1, 'Document type is required'),
  fileSize: z.string().optional(),
  fileKey: z.string().optional(),
})
