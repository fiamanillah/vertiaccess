// services/site-service/src/routes.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { cognitoAuth } from '@serverless-backend-starter/core';
import {
    createSiteSchema,
    updateSiteSchema,
    updateSiteStatusSchema,
    uploadUrlSchema,
    createDocumentSchema,
} from './schemas/site.schema.ts';
import {
    createSiteHandler,
    listSitesHandler,
    getSiteHandler,
    updateSiteHandler,
    updateSiteStatusHandler,
    deleteSiteHandler,
    listPublicSitesHandler,
} from './controllers/sites.ts';
import {
    generateUploadUrlHandler,
    uploadFileProxyHandler,
    createDocumentHandler,
    listDocumentsHandler,
    deleteDocumentHandler,
} from './controllers/documents.ts';
import {
    createBookingHandler,
    listMyBookingsHandler,
    listSiteBookingsHandler,
    listLandownerBookingsHandler,
    getBookingHandler,
    getBookingCertificateHandler,
    updateBookingStatusHandler,
} from './controllers/bookings.ts';
import { createBookingSchema, updateBookingStatusSchema } from './schemas/booking.schema.ts';

export const siteRoutes = new Hono();

// ==========================================
// Public endpoints (no auth)
// ==========================================
siteRoutes.get('/public', listPublicSitesHandler);

// ==========================================
// Protected Site endpoints (require auth)
// ==========================================

// Site CRUD
siteRoutes.post('/', cognitoAuth(), zValidator('json', createSiteSchema), createSiteHandler);
siteRoutes.get('/', cognitoAuth(), listSitesHandler);
siteRoutes.get('/:siteId', cognitoAuth(), getSiteHandler);
siteRoutes.patch(
    '/:siteId',
    cognitoAuth(),
    zValidator('json', updateSiteSchema),
    updateSiteHandler
);
siteRoutes.patch(
    '/:siteId/status',
    cognitoAuth(),
    zValidator('json', updateSiteStatusSchema),
    updateSiteStatusHandler
);
siteRoutes.delete('/:siteId', cognitoAuth(), deleteSiteHandler);

// File Upload
siteRoutes.post(
    '/upload-url',
    cognitoAuth(),
    zValidator('json', uploadUrlSchema),
    generateUploadUrlHandler
);
siteRoutes.put('/upload-file', cognitoAuth(), uploadFileProxyHandler);

// Document management
siteRoutes.post(
    '/:siteId/documents',
    cognitoAuth(),
    zValidator('json', createDocumentSchema),
    createDocumentHandler
);
siteRoutes.get('/:siteId/documents', cognitoAuth(), listDocumentsHandler);
siteRoutes.delete('/:siteId/documents/:docId', cognitoAuth(), deleteDocumentHandler);

// ==========================================
// Booking endpoints (require auth)
// ==========================================

// NOTE: Static sub-paths (/bookings/mine, /bookings/landowner) must come
// before wildcard path (/bookings/:bookingId) to avoid Hono conflict.

// Operator: create a new booking
siteRoutes.post(
    '/bookings',
    cognitoAuth(),
    zValidator('json', createBookingSchema),
    createBookingHandler
);

// Operator: list own bookings
siteRoutes.get('/bookings/mine', cognitoAuth(), listMyBookingsHandler);

// Landowner: list all bookings across their sites
siteRoutes.get('/bookings/landowner', cognitoAuth(), listLandownerBookingsHandler);

// Landowner/Admin: list bookings for a specific site
siteRoutes.get('/bookings/site/:siteId', cognitoAuth(), listSiteBookingsHandler);

// Operator/Landowner/Admin: get a single booking's consent certificate
siteRoutes.get('/bookings/:bookingId/certificate', cognitoAuth(), getBookingCertificateHandler);

// Operator/Landowner/Admin: get a single booking by ID
siteRoutes.get('/bookings/:bookingId', cognitoAuth(), getBookingHandler);

// Landowner: approve/reject | Operator: cancel
siteRoutes.patch(
    '/bookings/:bookingId/status',
    cognitoAuth(),
    zValidator('json', updateBookingStatusSchema),
    updateBookingStatusHandler
);
