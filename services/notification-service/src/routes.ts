import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { cognitoAuth } from '@vertiaccess/core';
import { createNotificationSchema } from './schemas/notification.schema.ts';
import {
    listNotificationsHandler,
    getUnreadCountHandler,
    createNotificationHandler,
    markNotificationReadHandler,
    markAllNotificationsReadHandler,
    deleteNotificationHandler,
} from './controllers/notifications.ts';

export const notificationRoutes = new Hono();

notificationRoutes.get('/', cognitoAuth(), listNotificationsHandler);
notificationRoutes.get('/unread-count', cognitoAuth(), getUnreadCountHandler);
notificationRoutes.post(
    '/',
    cognitoAuth(),
    zValidator('json', createNotificationSchema),
    createNotificationHandler
);
notificationRoutes.patch('/read-all', cognitoAuth(), markAllNotificationsReadHandler);
notificationRoutes.patch('/:id/read', cognitoAuth(), markNotificationReadHandler);
notificationRoutes.delete('/:id', cognitoAuth(), deleteNotificationHandler);
