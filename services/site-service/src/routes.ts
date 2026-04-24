// services/site-service/src/routes.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { cognitoAuth } from '@vertiaccess/core';
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
// removed booking imports

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

// (Booking endpoints have been moved to booking-service)
