// services/site-service/src/schemas/booking.schema.ts
import { z } from 'zod';

export const createBookingSchema = z.object({
    siteId: z.string().min(1, 'Site ID is required'),
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().min(1, 'End time is required'),
    droneModel: z.string().min(1, 'Drone model is required'),
    missionIntent: z.string().min(1, 'Mission intent is required'),
    useCategory: z.enum(['planned_toal', 'emergency_recovery']),
    operationReference: z.string().optional(),
    flyerId: z.string().optional(),
    // Payment fields — required only for PAYG bookings (no active subscription)
    paymentIntentId: z.string().optional(),
    billingMode: z.enum(['payg', 'subscription']).optional(),
});

export const updateBookingStatusSchema = z.object({
    status: z.enum(['APPROVED', 'REJECTED', 'CANCELLED']),
    adminNote: z.string().optional(),
});
