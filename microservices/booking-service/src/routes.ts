// services/booking-service/src/routes.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { cognitoAuth } from '@vertiaccess/core';
import {
    createBookingSchema,
    updateBookingStatusSchema,
    confirmEmergencyUsageSchema,
} from './schemas/booking.schema.ts';
import {
    createBookingHandler,
    updateBookingStatusHandler,
    confirmEmergencyUsageHandler,
} from './controllers/bookings.ts';

export const bookingRoutes = new Hono();

// Create booking
bookingRoutes.post(
    '/',
    cognitoAuth(),
    zValidator('json', createBookingSchema),
    createBookingHandler
);

// Update status
bookingRoutes.patch(
    '/:bookingId/status',
    cognitoAuth(),
    zValidator('json', updateBookingStatusSchema),
    updateBookingStatusHandler
);

// Confirm emergency usage (PAYG)
bookingRoutes.patch(
    '/:bookingId/emergency-usage',
    cognitoAuth(),
    zValidator('json', confirmEmergencyUsageSchema),
    confirmEmergencyUsageHandler
);
