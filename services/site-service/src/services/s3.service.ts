// services/site-service/src/services/s3.service.ts
import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
    region: process.env.APP_AWS_REGION || process.env.AWS_REGION || 'eu-west-2',
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'site-documents-398069593036-eu-west-2';

/**
 * Generate a presigned PUT URL for uploading a file to S3
 */
export async function generatePresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn: number = 900 // 15 minutes
): Promise<{ uploadUrl: string; fileKey: string }> {
    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
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
    contentType: string
): Promise<void> {
    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
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
    expiresIn: number = 3600 // 1 hour
): Promise<string> {
    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });

    return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Delete an object from S3
 */
export async function deleteS3Object(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });
    await s3Client.send(command);
}
