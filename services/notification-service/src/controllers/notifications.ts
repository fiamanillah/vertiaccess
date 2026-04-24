import type { Context } from 'hono';
import { z } from 'zod';
import { db } from '@vertiaccess/database';
import {
    AppError,
    HTTPStatusCode,
    sendCreatedResponse,
    sendResponse,
    type CognitoUser,
} from '@vertiaccess/core';
import { createNotificationSchema } from '../schemas/notification.schema.ts';

type NotificationType = 'success' | 'warning' | 'info' | 'error';

function getCognitoUser(c: Context): CognitoUser {
    return c.get('cognitoUser') as CognitoUser;
}

function isAdminUser(cognitoUser: CognitoUser): boolean {
    return (cognitoUser.role || '').toLowerCase() === 'admin';
}

function serializeNotification(notification: {
    id: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    actionUrl: string | null;
    relatedEntityId: string | null;
    createdAt: Date;
}) {
    return {
        id: notification.id,
        userId: notification.userId,
        type: notification.type as NotificationType,
        title: notification.title,
        message: notification.message,
        read: notification.isRead,
        actionUrl: notification.actionUrl,
        relatedEntityId: notification.relatedEntityId,
        timestamp: notification.createdAt.toISOString(),
    };
}

async function getTargetUserId(c: Context, cognitoUser: CognitoUser): Promise<string> {
    if (isAdminUser(cognitoUser)) {
        return c.req.query('userId') || cognitoUser.sub;
    }

    return cognitoUser.sub;
}

async function assertNotificationAccess(notificationId: string, cognitoUser: CognitoUser) {
    const notification = await db.notification.findUnique({
        where: { id: notificationId },
        select: { id: true, userId: true },
    });

    if (!notification) {
        throw new AppError({
            statusCode: HTTPStatusCode.NOT_FOUND,
            message: 'Notification not found',
            code: 'NOT_FOUND',
        });
    }

    if (!isAdminUser(cognitoUser) && notification.userId !== cognitoUser.sub) {
        throw new AppError({
            statusCode: HTTPStatusCode.FORBIDDEN,
            message: 'You do not have permission to access this notification',
            code: 'FORBIDDEN',
        });
    }

    return notification;
}

export async function listNotificationsHandler(c: Context): Promise<Response> {
    const cognitoUser = getCognitoUser(c);
    const userId = await getTargetUserId(c, cognitoUser);
    const unreadOnly = c.req.query('unreadOnly') === 'true';
    const limit = Math.min(Math.max(Number(c.req.query('limit') || 20), 1), 100);
    const page = Math.max(Number(c.req.query('page') || 1), 1);
    const skip = (page - 1) * limit;

    const where = {
        userId,
        ...(unreadOnly ? { isRead: false } : {}),
    };

    const [total, notifications] = await Promise.all([
        db.notification.count({ where }),
        db.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        }),
    ]);

    const totalPages = Math.max(Math.ceil(total / limit), 1);

    return sendResponse(c, {
        message: 'Notifications retrieved successfully',
        data: {
            items: notifications.map(serializeNotification),
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        },
    });
}

export async function getUnreadCountHandler(c: Context): Promise<Response> {
    const cognitoUser = getCognitoUser(c);
    const userId = await getTargetUserId(c, cognitoUser);

    const unreadCount = await db.notification.count({
        where: {
            userId,
            isRead: false,
        },
    });

    return sendResponse(c, {
        message: 'Unread notification count retrieved successfully',
        data: { unreadCount },
    });
}

export async function createNotificationHandler(c: Context): Promise<Response> {
    const cognitoUser = getCognitoUser(c);

    if (!isAdminUser(cognitoUser)) {
        throw new AppError({
            statusCode: HTTPStatusCode.FORBIDDEN,
            message: 'Only admins can create notifications',
            code: 'FORBIDDEN',
        });
    }

    const body = c.req.valid('json') as z.infer<typeof createNotificationSchema>;

    const targetUser = await db.user.findUnique({
        where: { id: body.userId },
        select: { id: true },
    });

    if (!targetUser) {
        throw new AppError({
            statusCode: HTTPStatusCode.NOT_FOUND,
            message: 'Target user not found',
            code: 'NOT_FOUND',
        });
    }

    const notification = await db.notification.create({
        data: {
            userId: body.userId,
            type: body.type,
            title: body.title,
            message: body.message,
            actionUrl: body.actionUrl || null,
            relatedEntityId: body.relatedEntityId || null,
        },
    });

    return sendCreatedResponse(
        c,
        serializeNotification(notification),
        'Notification created successfully'
    );
}

export async function markNotificationReadHandler(c: Context): Promise<Response> {
    const cognitoUser = getCognitoUser(c);
    const { id } = c.req.param();

    await assertNotificationAccess(id, cognitoUser);

    const notification = await db.notification.update({
        where: { id },
        data: { isRead: true },
    });

    return sendResponse(c, {
        message: 'Notification marked as read',
        data: serializeNotification(notification),
    });
}

export async function markAllNotificationsReadHandler(c: Context): Promise<Response> {
    const cognitoUser = getCognitoUser(c);
    const userId = await getTargetUserId(c, cognitoUser);

    const result = await db.notification.updateMany({
        where: {
            userId,
            isRead: false,
        },
        data: { isRead: true },
    });

    return sendResponse(c, {
        message: 'All notifications marked as read',
        data: { updatedCount: result.count },
    });
}

export async function deleteNotificationHandler(c: Context): Promise<Response> {
    const cognitoUser = getCognitoUser(c);
    const { id } = c.req.param();

    await assertNotificationAccess(id, cognitoUser);

    await db.notification.delete({
        where: { id },
    });

    return sendResponse(c, {
        message: 'Notification deleted successfully',
    });
}
