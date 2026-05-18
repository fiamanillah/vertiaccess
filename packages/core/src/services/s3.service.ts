// packages/core/src/services/s3.service.ts
import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
    region: process.env.APP_AWS_REGION || process.env.AWS_REGION || 'us-east-2',
});

// Bucket configuration matching active S3 buckets
export const BUCKETS = {
    PUBLIC: process.env.PUBLIC_S3_BUCKET || 'vertiaccess-fiamanillah-sitedocumentsbucket-rfhsbuat',
    PRIVATE: process.env.PRIVATE_S3_BUCKET || 'vertiaccess-fiamanillah-privatedocumentsbucket-mmsfmshn',
} as const;

export type BucketCategory = keyof typeof BUCKETS;

/**
 * Generate a presigned PUT URL for uploading a file to S3
 */
export async function generatePresignedUploadUrl(
    key: string,
    contentType: string,
    category: BucketCategory = 'PUBLIC',
    expiresIn: number = 900 // 15 minutes
): Promise<{ uploadUrl: string; fileKey: string }> {
    const command = new PutObjectCommand({
        Bucket: BUCKETS[category],
        Key: key,
        ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return { uploadUrl, fileKey: key };
}

/**
 * Upload raw bytes to S3 from the backend (no browser CORS involved).
 */
export async function uploadObjectToS3(
    key: string,
    body: Uint8Array,
    contentType: string,
    category: BucketCategory = 'PUBLIC'
): Promise<void> {
    const command = new PutObjectCommand({
        Bucket: BUCKETS[category],
        Key: key,
        Body: body,
        ContentType: contentType,
    });

    await s3Client.send(command);
}

/**
 * Generate a presigned GET URL for downloading/viewing a file
 */
export async function generatePresignedDownloadUrl(
    key: string,
    category?: BucketCategory,
    expiresIn: number = 3600 // 1 hour
): Promise<string> {
    // Dynamically resolve public/private bucket based on file key structure if not explicitly provided
    let resolvedCategory: BucketCategory = category || 'PUBLIC';
    if (!category) {
        const isPrivate = key.includes('/docs/') || key.startsWith('verifications/');
        resolvedCategory = isPrivate ? 'PRIVATE' : 'PUBLIC';
    }

    const command = new GetObjectCommand({
        Bucket: BUCKETS[resolvedCategory],
        Key: key,
    });

    return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Delete an object from S3
 */
export async function deleteS3Object(
    key: string,
    category?: BucketCategory
): Promise<void> {
    // Dynamically resolve public/private bucket based on file key structure if not explicitly provided
    let resolvedCategory: BucketCategory = category || 'PUBLIC';
    if (!category) {
        const isPrivate = key.includes('/docs/') || key.startsWith('verifications/');
        resolvedCategory = isPrivate ? 'PRIVATE' : 'PUBLIC';
    }

    const command = new DeleteObjectCommand({
        Bucket: BUCKETS[resolvedCategory],
        Key: key,
    });
    await s3Client.send(command);
}
