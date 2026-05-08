// services/site-service/src/controllers/documents.ts
import type { Context } from 'hono';
import { z } from 'zod';
import { db } from '@vertiaccess/database';
import {
    AppError,
    HTTPStatusCode,
    sendResponse,
    sendCreatedResponse,
    type CognitoUser,
} from '@vertiaccess/core';
import { uploadUrlSchema, createDocumentSchema } from '../schemas/site.schema.ts';
import {
    generatePresignedUploadUrl,
    generatePresignedDownloadUrl,
    deleteS3Object,
    uploadObjectToS3,
} from '../services/s3.service.ts';
import { randomUUID } from 'crypto';

function getCognitoUser(c: Context): CognitoUser {
    return c.get('cognitoUser') as CognitoUser;
}

/**
 * POST /sites/v1/upload-url — Generate a presigned S3 upload URL
 */
export async function generateUploadUrlHandler(c: Context): Promise<Response> {
    const cognitoUser = getCognitoUser(c);
    const body = (c.req as any).valid('json') as z.infer<typeof uploadUrlSchema>;

    const fileId = randomUUID();
    const sanitizedName = body.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const folder = body.siteId || 'new';
    const key = `sites/${cognitoUser.sub}/${folder}/${fileId}-${sanitizedName}`;

    const { uploadUrl, fileKey } = await generatePresignedUploadUrl(key, body.contentType);

    return sendResponse(c, {
        message: 'Upload URL generated',
        data: { uploadUrl, fileKey },
    });
}

/**
 * POST /sites/v1/upload-file — Upload directly via backend as a CORS-safe fallback
 */
export async function uploadFileProxyHandler(c: Context): Promise<Response> {
    const cognitoUser = getCognitoUser(c);
    const formData = await c.req.formData();

    const file = formData.get('file') as any;
    const documentType = (formData.get('documentType') as string) || 'ownership';
    const siteId = (formData.get('siteId') as string) || 'new';

    if (!file || typeof file.arrayBuffer !== 'function') {
        throw new AppError({
            statusCode: HTTPStatusCode.BAD_REQUEST,
            message: 'File is required',
            code: 'VALIDATION_ERROR',
        });
    }

    const allowedDocumentTypes = ['policy', 'ownership', 'photo'];
    if (!allowedDocumentTypes.includes(documentType)) {
        throw new AppError({
            statusCode: HTTPStatusCode.BAD_REQUEST,
            message: 'Invalid documentType',
            code: 'VALIDATION_ERROR',
        });
    }

    const fileId = randomUUID();
    const originalName = String(file.name || 'upload.bin');
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `sites/${cognitoUser.sub}/${siteId}/${fileId}-${sanitizedName}`;
    const contentType = String(file.type || 'application/octet-stream');

    const bytes = new Uint8Array(await file.arrayBuffer());
    await uploadObjectToS3(key, bytes, contentType);

    return sendResponse(c, {
        message: 'File uploaded',
        data: {
            fileKey: key,
            fileName: originalName,
            fileSize: String(file.size || bytes.byteLength),
            documentType,
        },
    });
}

/**
 * POST /sites/v1/:siteId/documents — Register an uploaded document
 */
export async function createDocumentHandler(c: Context): Promise<Response> {
    const cognitoUser = getCognitoUser(c);
    const siteId = c.req.param('siteId');
    const body = (c.req as any).valid('json') as z.infer<typeof createDocumentSchema>;

    // Verify ownership
    const site = await db.site.findUnique({ where: { id: siteId } });
    if (!site || site.deletedAt) {
        throw new AppError({
            statusCode: HTTPStatusCode.NOT_FOUND,
            message: 'Site not found',
            code: 'NOT_FOUND',
        });
    }

    const isAdmin = (cognitoUser.role || '').toLowerCase() === 'admin';
    if (!isAdmin && cognitoUser.sub !== site.landownerId) {
        throw new AppError({
            statusCode: HTTPStatusCode.FORBIDDEN,
            message: 'Not authorized',
            code: 'FORBIDDEN',
        });
    }

    const doc = await db.siteDocument.create({
        data: {
            siteId,
            fileKey: body.fileKey,
            fileName: body.fileName || null,
            fileSize: body.fileSize || null,
            documentType: body.documentType || null,
        },
    });

    const downloadUrl = await generatePresignedDownloadUrl(doc.fileKey);

    return sendCreatedResponse(
        c,
        {
            id: doc.id,
            fileKey: doc.fileKey,
            fileName: doc.fileName,
            fileSize: doc.fileSize,
            documentType: doc.documentType,
            downloadUrl,
            uploadedAt: doc.uploadedAt.toISOString(),
        },
        'Document registered'
    );
}

/**
 * GET /sites/v1/:siteId/documents — List documents for a site
 */
export async function listDocumentsHandler(c: Context): Promise<Response> {
    const cognitoUser = getCognitoUser(c);
    const siteId = c.req.param('siteId');

    // Verify ownership
    const site = await db.site.findUnique({ where: { id: siteId } });
    if (!site || site.deletedAt) {
        throw new AppError({
            statusCode: HTTPStatusCode.NOT_FOUND,
            message: 'Site not found',
            code: 'NOT_FOUND',
        });
    }

    const isAdmin = (cognitoUser.role || '').toLowerCase() === 'admin';
    if (!isAdmin && cognitoUser.sub !== site.landownerId) {
        throw new AppError({
            statusCode: HTTPStatusCode.FORBIDDEN,
            message: 'Not authorized',
            code: 'FORBIDDEN',
        });
    }

    const docs = await db.siteDocument.findMany({
        where: { siteId },
        orderBy: { uploadedAt: 'desc' },
    });

    const serialized = await Promise.all(
        docs.map(async doc => ({
            id: doc.id,
            fileKey: doc.fileKey,
            fileName: doc.fileName,
            fileSize: doc.fileSize,
            documentType: doc.documentType,
            downloadUrl: await generatePresignedDownloadUrl(doc.fileKey),
            uploadedAt: doc.uploadedAt.toISOString(),
        }))
    );

    return sendResponse(c, {
        message: 'Documents fetched',
        data: serialized,
    });
}

/**
 * DELETE /sites/v1/:siteId/documents/:docId — Delete a document
 */
export async function deleteDocumentHandler(c: Context): Promise<Response> {
    const cognitoUser = getCognitoUser(c);
    const siteId = c.req.param('siteId');
    const docId = c.req.param('docId');

    const site = await db.site.findUnique({ where: { id: siteId } });
    if (!site || site.deletedAt) {
        throw new AppError({
            statusCode: HTTPStatusCode.NOT_FOUND,
            message: 'Site not found',
            code: 'NOT_FOUND',
        });
    }

    const isAdmin = (cognitoUser.role || '').toLowerCase() === 'admin';
    if (!isAdmin && cognitoUser.sub !== site.landownerId) {
        throw new AppError({
            statusCode: HTTPStatusCode.FORBIDDEN,
            message: 'Not authorized',
            code: 'FORBIDDEN',
        });
    }

    const doc = await db.siteDocument.findUnique({ where: { id: docId } });
    if (!doc || doc.siteId !== siteId) {
        throw new AppError({
            statusCode: HTTPStatusCode.NOT_FOUND,
            message: 'Document not found',
            code: 'NOT_FOUND',
        });
    }

    // Delete from S3
    try {
        await deleteS3Object(doc.fileKey);
    } catch (err) {
        // Log but don't fail — the DB record should still be cleaned up
        console.error('Failed to delete S3 object:', err);
    }

    await db.siteDocument.delete({ where: { id: docId } });

    return sendResponse(c, { message: 'Document deleted' });
}
