// services/site-service/src/schemas/booking.schema.ts
import { z } from 'zod'

export const createBookingSchema = z.object({
  siteId: z.string().min(1, 'Site ID is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  aircraftId: z.string().optional(),
  droneModel: z.string().optional(),
  manufacturer: z.string().optional(),
  airframe: z.string().optional(),
  mtow: z.string().optional(),
  missionIntent: z.string().min(1, 'Mission intent is required'),
  useCategory: z.enum(['planned_toal', 'emergency_recovery']),
  operationType: z
    .enum(['INBOUND', 'OUTBOUND', 'Inbound', 'Outbound'])
    .transform((value) => value.toUpperCase() as 'INBOUND' | 'OUTBOUND')
    .optional(),
  operationReference: z.string().optional(),
  flyerId: z.string().optional(),
  supportingDocuments: z
    .array(
      z.object({
        fileKey: z.string().min(1, 'Document file key is required'),
        fileName: z.string().optional(),
        fileSize: z.number().nonnegative().optional(),
      }),
    )
    .optional(),
  // Payment fields — required only for PAYG bookings (no active subscription)
  paymentIntentId: z.string().optional(),
  billingMode: z.enum(['payg', 'subscription']).optional(),
})

export const updateBookingStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'CANCELLED']),
  adminNote: z.string().optional(),
})

export const confirmEmergencyUsageSchema = z.object({
  used: z.boolean(),
})
