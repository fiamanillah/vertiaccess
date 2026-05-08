import { z } from 'zod';

export const notificationTypeSchema = z.enum(['success', 'warning', 'info', 'error']);

export const createNotificationSchema = z.object({
    userId: z.string().min(1),
    type: notificationTypeSchema,
    title: z.string().min(1),
    message: z.string().min(1),
    actionUrl: z.string().url().optional().or(z.literal('')),
    relatedEntityId: z.string().min(1).optional(),
});
