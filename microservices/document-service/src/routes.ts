import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { cognitoAuth } from '@vertiaccess/core';
import { uploadUrlSchema, createDocumentSchema } from './schemas/site.schema.ts';
import {
    generateUploadUrlHandler,
    uploadFileProxyHandler,
    createDocumentHandler,
    listDocumentsHandler,
    deleteDocumentHandler,
} from './controllers/documents.ts';

export const documentRoutes = new Hono();

// File Upload
documentRoutes.post(
    '/upload-url',
    cognitoAuth(),
    zValidator('json', uploadUrlSchema),
    generateUploadUrlHandler
);
documentRoutes.put('/upload-file', cognitoAuth(), uploadFileProxyHandler);

// Document management
documentRoutes.post(
    '/:siteId',
    cognitoAuth(),
    zValidator('json', createDocumentSchema),
    createDocumentHandler
);
documentRoutes.get('/:siteId', cognitoAuth(), listDocumentsHandler);
documentRoutes.delete('/:siteId/:docId', cognitoAuth(), deleteDocumentHandler);
