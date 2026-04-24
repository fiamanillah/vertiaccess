// services/booking-service/src/routes.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { cognitoAuth } from '@vertiaccess/core';
import {
    createBookingHandler,
    listMyBookingsHandler,
    listSiteBookingsHandler,
    listLandownerBookingsHandler,
    getBookingHandler,
    getBookingCertificateHandler,
    updateBookingStatusHandler,
    confirmEmergencyUsageHandler,
} from './controllers/bookings.ts';
import {
    createBookingSchema,
    updateBookingStatusSchema,
    confirmEmergencyUsageSchema,
} from './schemas/booking.schema.ts';

export const bookingRoutes = new Hono();

// ==========================================
// Booking endpoints (require auth)
// ==========================================

// NOTE: Static sub-paths (/mine, /landowner) must come
// before wildcard path (/:bookingId) to avoid Hono conflict.

// Operator: create a new booking
bookingRoutes.post(
    '/',
    cognitoAuth(),
    zValidator('json', createBookingSchema),
    createBookingHandler
);

// Operator: list own bookings
bookingRoutes.get('/mine', cognitoAuth(), listMyBookingsHandler);

// Landowner: list all bookings across their sites
bookingRoutes.get('/landowner', cognitoAuth(), listLandownerBookingsHandler);

// Landowner/Admin: list bookings for a specific site
bookingRoutes.get('/site/:siteId', cognitoAuth(), listSiteBookingsHandler);

// Operator/Landowner/Admin: get a single booking's consent certificate
bookingRoutes.get('/:bookingId/certificate', cognitoAuth(), getBookingCertificateHandler);

// Operator/Landowner/Admin: get a single booking by ID
bookingRoutes.get('/:bookingId', cognitoAuth(), getBookingHandler);

// Landowner: approve/reject | Operator: cancel
bookingRoutes.patch(
    '/:bookingId/status',
    cognitoAuth(),
    zValidator('json', updateBookingStatusSchema),
    updateBookingStatusHandler
);

// Operator: confirm whether Emergency & Recovery was used
bookingRoutes.patch(
    '/:bookingId/emergency-usage',
    cognitoAuth(),
    zValidator('json', confirmEmergencyUsageSchema),
    confirmEmergencyUsageHandler
);
