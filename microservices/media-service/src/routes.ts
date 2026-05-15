import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { cognitoAuth } from '@vertiaccess/core';
import {
    generateUploadUrlHandler,
    uploadFileProxyHandler,
    registerMediaHandler,
    deleteMediaHandler,
} from './controllers/media.ts';
import { uploadUrlSchema, createMediaRecordSchema } from './schemas/media.schema.ts';

export const documentRoutes = new Hono();

// --- Generic Media API (Preferred) ---
documentRoutes.post(
    '/upload-url',
    cognitoAuth(),
    zValidator('json', uploadUrlSchema),
    generateUploadUrlHandler
);
documentRoutes.put('/upload-file', cognitoAuth(), uploadFileProxyHandler);
documentRoutes.post(
    '/register',
    cognitoAuth(),
    zValidator('json', createMediaRecordSchema),
    registerMediaHandler
);
documentRoutes.delete(
    '/:category',
    cognitoAuth(),
    deleteMediaHandler
);

// --- Legacy / Backward Compatibility Aliases ---
// These allow existing "Site" logic to continue working without frontend changes
documentRoutes.post(
    '/sites/v1/upload-url',
    cognitoAuth(),
    zValidator('json', uploadUrlSchema),
    generateUploadUrlHandler
);
documentRoutes.post(
    '/sites/v1/:siteId/documents',
    cognitoAuth(),
    zValidator('json', createMediaRecordSchema),
    async (c) => {
        const siteId = c.req.param('siteId');
        // Inject entityId from param into body for the handler
        const body = await c.req.json();
        body.entityId = siteId;
        if (!body.category) body.category = body.documentType || 'SITE_DOCUMENT';
        
        // Manual override for the validator if needed, or just trust the body
        return registerMediaHandler(c);
    }
);
