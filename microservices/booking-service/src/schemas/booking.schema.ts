// services/site-service/src/schemas/booking.schema.ts
import { z } from 'zod';

export const createBookingSchema = z.object({
    siteId: z.string().min(1, 'Site ID is required'),
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().min(1, 'End time is required'),
    droneModel: z.string().min(1, 'Drone model is required'),
    manufacturer: z.string().min(1, 'Manufacturer is required'),
    airframe: z.string().min(1, 'Airframe is required'),
    mtow: z.string().min(1, 'Maximum Take-off Weight (MTOW) is required'),
    missionIntent: z.string().min(1, 'Mission intent is required'),
    useCategory: z.enum(['planned_toal', 'emergency_recovery']),
    operationReference: z.string().optional(),
    flyerId: z.string().optional(),
    operatorPhone: z.string().optional(),
    // Payment fields — required only for PAYG bookings (no active subscription)
    paymentIntentId: z.string().optional(),
    billingMode: z.enum(['payg', 'subscription']).optional(),
    paymentMethodId: z.string().optional(),
    // Emergency authorization — operator must agree to the charge before booking
    emergencyAuthAgreed: z.boolean().optional(),
}).superRefine((data, ctx) => {
    if (data.useCategory === 'emergency_recovery' && !data.emergencyAuthAgreed) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['emergencyAuthAgreed'],
            message:
                'You must authorize the emergency landing charge before booking an Emergency & Recovery site.',
        });
    }
});

export const updateBookingStatusSchema = z.object({
    status: z.enum(['APPROVED', 'REJECTED', 'CANCELLED']),
    adminNote: z.string().optional(),
});

export const confirmEmergencyUsageSchema = z.object({
    used: z.boolean(),
});
