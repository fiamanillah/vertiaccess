import { z } from 'zod';

export const MediaCategory = z.enum([
    'SITE_PHOTO',
    'SITE_POLICY',
    'SITE_OWNERSHIP',
    'IDENTITY_VERIFICATION',
    'USER_AVATAR',
    'GENERAL'
]);

export type MediaCategory = z.infer<typeof MediaCategory>;

export const uploadUrlSchema = z.object({
    fileName: z.string().min(1, 'File name is required'),
    contentType: z.string().min(1, 'Content type is required'),
    category: MediaCategory.default('GENERAL'),
    entityId: z.string().optional(), // e.g. siteId or userId
});

export const createMediaRecordSchema = z.object({
    fileKey: z.string().min(1, 'File key is required'),
    fileName: z.string().min(1, 'File name is required'),
    fileSize: z.string().optional(),
    category: MediaCategory,
    entityId: z.string().optional(),
});
