// microservices/notification-service/src/services/notifications/notifications.service.ts
import { db } from '@vertiaccess/database';
import {
    AppError,
    HTTPStatusCode,
    type CognitoUser,
} from '@vertiaccess/core';

type NotificationType = 'success' | 'warning' | 'info' | 'error';

export function serializeNotification(notification: any) {
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

export class NotificationsService {
    static async getTargetUserId(cognitoUser: CognitoUser, queryUserId?: string): Promise<string> {
        const isAdmin = (cognitoUser.role || '').toLowerCase() === 'admin';
        if (isAdmin && queryUserId) {
            return queryUserId;
        }
        return cognitoUser.sub;
    }

    static async assertNotificationAccess(notificationId: string, cognitoUser: CognitoUser) {
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

        const isAdmin = (cognitoUser.role || '').toLowerCase() === 'admin';
        if (!isAdmin && notification.userId !== cognitoUser.sub) {
            throw new AppError({
                statusCode: HTTPStatusCode.FORBIDDEN,
                message: 'You do not have permission to access this notification',
                code: 'FORBIDDEN',
            });
        }

        return notification;
    }

    static async listNotifications(cognitoUser: CognitoUser, params: {
        unreadOnly?: boolean;
        limit?: number;
        page?: number;
        queryUserId?: string;
    }) {
        const userId = await this.getTargetUserId(cognitoUser, params.queryUserId);
        const limit = Math.min(Math.max(params.limit || 20, 1), 100);
        const page = Math.max(params.page || 1, 1);
        const skip = (page - 1) * limit;

        const where = {
            userId,
            ...(params.unreadOnly ? { isRead: false } : {}),
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

        return {
            items: notifications.map(serializeNotification),
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        };
    }

    static async getUnreadCount(cognitoUser: CognitoUser, queryUserId?: string) {
        const userId = await this.getTargetUserId(cognitoUser, queryUserId);

        const unreadCount = await db.notification.count({
            where: {
                userId,
                isRead: false,
            },
        });

        return { unreadCount };
    }

    static async createNotification(cognitoUser: CognitoUser, body: any) {
        const isAdmin = (cognitoUser.role || '').toLowerCase() === 'admin';
        if (!isAdmin) {
            throw new AppError({
                statusCode: HTTPStatusCode.FORBIDDEN,
                message: 'Only admins can create notifications',
                code: 'FORBIDDEN',
            });
        }

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

        return serializeNotification(notification);
    }

    static async markRead(cognitoUser: CognitoUser, notificationId: string) {
        await this.assertNotificationAccess(notificationId, cognitoUser);

        const notification = await db.notification.update({
            where: { id: notificationId },
            data: { isRead: true },
        });

        return serializeNotification(notification);
    }

    static async markAllRead(cognitoUser: CognitoUser, queryUserId?: string) {
        const userId = await this.getTargetUserId(cognitoUser, queryUserId);

        const result = await db.notification.updateMany({
            where: {
                userId,
                isRead: false,
            },
            data: { isRead: true },
        });

        return { updatedCount: result.count };
    }

    static async deleteNotification(cognitoUser: CognitoUser, notificationId: string) {
        await this.assertNotificationAccess(notificationId, cognitoUser);

        await db.notification.delete({
            where: { id: notificationId },
        });
    }
}
