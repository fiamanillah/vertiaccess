import type { Context } from 'hono';
import { z } from 'zod';
import { db } from '@vertiaccess/database';
import {
    AppError,
    HTTPStatusCode,
    sendResponse,
    sendCreatedResponse,
    generatePresignedUploadUrl,
    generatePresignedDownloadUrl,
    deleteS3Object,
    uploadObjectToS3,
    type BucketCategory,
    type CognitoUser,
} from '@vertiaccess/core';
import { uploadUrlSchema, createMediaRecordSchema, MediaCategory } from '../schemas/media.schema.ts';
import { randomUUID } from 'crypto';

function getCognitoUser(c: Context): CognitoUser {
    return c.get('cognitoUser') as CognitoUser;
}

/**
 * Helper to determine bucket and key prefix based on category
 */
function getStorageConfig(category: MediaCategory, userId: string, entityId?: string): {
    bucketCategory: BucketCategory;
    keyPrefix: string;
} {
    switch (category) {
        case 'IDENTITY_VERIFICATION':
            return {
                bucketCategory: 'PRIVATE',
                keyPrefix: `verifications/${userId}/identity`,
            };
        case 'SITE_OWNERSHIP':
        case 'SITE_POLICY':
            return {
                bucketCategory: 'PRIVATE',
                keyPrefix: `sites/${userId}/${entityId || 'general'}/docs`,
            };
        case 'SITE_PHOTO':
            return {
                bucketCategory: 'PUBLIC',
                keyPrefix: `sites/${userId}/${entityId || 'general'}/photos`,
            };
        case 'USER_AVATAR':
            return {
                bucketCategory: 'PUBLIC',
                keyPrefix: `profiles/${userId}/avatar`,
            };
        default:
            return {
                bucketCategory: 'PUBLIC',
                keyPrefix: `general/${userId}`,
            };
    }
}

/**
 * POST /media/v1/upload-url — Generate a presigned S3 upload URL
 */
export async function generateUploadUrlHandler(c: Context): Promise<Response> {
    const cognitoUser = getCognitoUser(c);
    const body = (c.req as any).valid('json') as z.infer<typeof uploadUrlSchema>;

    const { bucketCategory, keyPrefix } = getStorageConfig(body.category, cognitoUser.sub, body.entityId);
    
    const fileId = randomUUID();
    const sanitizedName = body.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `${keyPrefix}/${fileId}-${sanitizedName}`;

    const { uploadUrl, fileKey } = await generatePresignedUploadUrl(key, body.contentType, bucketCategory);

    return sendResponse(c, {
        message: 'Upload URL generated',
        data: { uploadUrl, fileKey, bucket: bucketCategory },
    });
}

/**
 * POST /media/v1/upload-file — Upload directly via backend
 */
export async function uploadFileProxyHandler(c: Context): Promise<Response> {
    const cognitoUser = getCognitoUser(c);
    const formData = await c.req.formData();

    const file = formData.get('file') as any;
    const category = (formData.get('category') as MediaCategory) || 'GENERAL';
    const entityId = formData.get('entityId') as string;

    if (!file || typeof file.arrayBuffer !== 'function') {
        throw new AppError({
            statusCode: HTTPStatusCode.BAD_REQUEST,
            message: 'File is required',
            code: 'VALIDATION_ERROR',
        });
    }

    const { bucketCategory, keyPrefix } = getStorageConfig(category, cognitoUser.sub, entityId);

    const fileId = randomUUID();
    const originalName = String(file.name || 'upload.bin');
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `${keyPrefix}/${fileId}-${sanitizedName}`;
    const contentType = String(file.type || 'application/octet-stream');

    const bytes = new Uint8Array(await file.arrayBuffer());
    await uploadObjectToS3(key, bytes, contentType, bucketCategory);

    return sendResponse(c, {
        message: 'File uploaded',
        data: {
            fileKey: key,
            fileName: originalName,
            fileSize: String(file.size || bytes.byteLength),
            category,
            bucket: bucketCategory,
        },
    });
}

/**
 * POST /media/v1/register — Register an uploaded media file in the DB (for sites)
 */
export async function registerMediaHandler(c: Context): Promise<Response> {
    const cognitoUser = getCognitoUser(c);
    const body = (c.req as any).valid('json') as z.infer<typeof createMediaRecordSchema>;

    // For backward compatibility with sites
    if (body.category.startsWith('SITE_') && body.entityId) {
        const site = await db.site.findUnique({ where: { id: body.entityId } });
        if (!site || site.deletedAt) {
            throw new AppError({
                statusCode: HTTPStatusCode.NOT_FOUND,
                message: 'Site not found',
                code: 'NOT_FOUND',
            });
        }

        const isAdmin = (cognitoUser.role || '').toLowerCase() === 'admin';
        if (!isAdmin && cognitoUser.sub !== site.assetOwnerId) {
            throw new AppError({
                statusCode: HTTPStatusCode.FORBIDDEN,
                message: 'Not authorized',
                code: 'FORBIDDEN',
            });
        }

        const doc = await db.siteDocument.create({
            data: {
                siteId: body.entityId,
                fileKey: body.fileKey,
                fileName: body.fileName || null,
                fileSize: body.fileSize || null,
                documentType: body.category,
            },
        });

        const { bucketCategory } = getStorageConfig(body.category, cognitoUser.sub, body.entityId);
        const downloadUrl = await generatePresignedDownloadUrl(doc.fileKey, bucketCategory);

        return sendCreatedResponse(c, {
            id: doc.id,
            fileKey: doc.fileKey,
            fileName: doc.fileName,
            downloadUrl,
        }, 'Document registered');
    }

    return sendResponse(c, { message: 'Media registered (stateless)' });
}

/**
 * DELETE /media/v1/:category/*fileKey — Delete a file from S3
 */
export async function deleteMediaHandler(c: Context): Promise<Response> {
    const cognitoUser = getCognitoUser(c);
    const category = c.req.param('category') as MediaCategory;
    const fileKey = c.req.param('fileKey') || c.req.query('fileKey');

    if (!fileKey) {
        throw new AppError({
            statusCode: HTTPStatusCode.BAD_REQUEST,
            message: 'fileKey is required',
            code: 'VALIDATION_ERROR',
        });
    }

    const { bucketCategory } = getStorageConfig(category, cognitoUser.sub);

    // Basic security check: Ensure the fileKey starts with the expected path for this user
    // Path format: ${prefix}/${userId}/...
    if (!fileKey.includes(`/${cognitoUser.sub}/`)) {
        throw new AppError({
            statusCode: HTTPStatusCode.FORBIDDEN,
            message: 'Not authorized to delete this file',
            code: 'FORBIDDEN',
        });
    }

    await deleteS3Object(fileKey, bucketCategory);

    return sendResponse(c, { message: 'Media deleted from S3' });
}
