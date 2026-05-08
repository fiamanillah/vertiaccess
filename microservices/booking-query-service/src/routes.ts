import { Hono } from 'hono';
import { cognitoAuth } from '@vertiaccess/core';
import {
    getPublicSiteAvailabilityHandler,
    listMyBookingsHandler,
    listSiteBookingsHandler,
    listLandownerBookingsHandler,
    getBookingHandler,
    getBookingCertificateHandler,
} from './controllers/bookings.ts';

export const bookingQueryRoutes = new Hono();

// Public availability
bookingQueryRoutes.get('/availability/:siteId', getPublicSiteAvailabilityHandler);

// Operator queries
bookingQueryRoutes.get('/mine', cognitoAuth(), listMyBookingsHandler);

// Landowner/Admin queries
bookingQueryRoutes.get('/landowner', cognitoAuth(), listLandownerBookingsHandler);
bookingQueryRoutes.get('/site/:siteId', cognitoAuth(), listSiteBookingsHandler);

// Shared queries
bookingQueryRoutes.get('/:bookingId', cognitoAuth(), getBookingHandler);
bookingQueryRoutes.get('/:bookingId/certificate', cognitoAuth(), getBookingCertificateHandler);
