// microservices/notification-service/src/controllers/notifications.ts
import type { Context } from 'hono';
import { z } from 'zod';
import {
    AppError,
    HTTPStatusCode,
    sendCreatedResponse,
    sendResponse,
    type CognitoUser,
} from '@vertiaccess/core';
import { createNotificationSchema } from '../schemas/notification.schema.ts';
import { NotificationsService } from '../services/notifications/notifications.service.ts';

function getCognitoUser(c: Context): CognitoUser {
    return c.get('cognitoUser') as CognitoUser;
}

export async function listNotificationsHandler(c: Context): Promise<Response> {
    const cognitoUser = getCognitoUser(c);
    const params = {
        unreadOnly: c.req.query('unreadOnly') === 'true',
        limit: Number(c.req.query('limit')),
        page: Number(c.req.query('page')),
        queryUserId: c.req.query('userId'),
    };

    const data = await NotificationsService.listNotifications(cognitoUser, params);

    return sendResponse(c, {
        message: 'Notifications retrieved successfully',
        data,
    });
}

export async function getUnreadCountHandler(c: Context): Promise<Response> {
    const cognitoUser = getCognitoUser(c);
    const queryUserId = c.req.query('userId');

    const data = await NotificationsService.getUnreadCount(cognitoUser, queryUserId);

    return sendResponse(c, {
        message: 'Unread notification count retrieved successfully',
        data,
    });
}

export async function createNotificationHandler(c: Context): Promise<Response> {
    const cognitoUser = getCognitoUser(c);
    const body = (c.req as any).valid('json') as z.infer<typeof createNotificationSchema>;

    const data = await NotificationsService.createNotification(cognitoUser, body);

    return sendCreatedResponse(c, data, 'Notification created successfully');
}

export async function markNotificationReadHandler(c: Context): Promise<Response> {
    const cognitoUser = getCognitoUser(c);
    const id = c.req.param('id');
    if (!id) {
        throw new AppError({
            statusCode: HTTPStatusCode.BAD_REQUEST,
            message: 'Notification ID is required',
            code: 'BAD_REQUEST',
        });
    }

    const data = await NotificationsService.markRead(cognitoUser, id);

    return sendResponse(c, {
        message: 'Notification marked as read',
        data,
    });
}

export async function markAllNotificationsReadHandler(c: Context): Promise<Response> {
    const cognitoUser = getCognitoUser(c);
    const queryUserId = c.req.query('userId');

    const data = await NotificationsService.markAllRead(cognitoUser, queryUserId);

    return sendResponse(c, {
        message: 'All notifications marked as read',
        data,
    });
}

export async function deleteNotificationHandler(c: Context): Promise<Response> {
    const cognitoUser = getCognitoUser(c);
    const id = c.req.param('id');
    if (!id) {
        throw new AppError({
            statusCode: HTTPStatusCode.BAD_REQUEST,
            message: 'Notification ID is required',
            code: 'BAD_REQUEST',
        });
    }

    await NotificationsService.deleteNotification(cognitoUser, id);

    return sendResponse(c, {
        message: 'Notification deleted successfully',
    });
}
