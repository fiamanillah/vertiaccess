import { getApiBaseUrl } from './api';
import type { Notification } from '../components/NotificationsDropdown';

export interface NotificationPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

export interface NotificationsPageResponse {
    notifications: Notification[];
    pagination: NotificationPagination;
}

interface ApiNotification {
    id: string;
    userId: string;
    type: 'success' | 'warning' | 'info' | 'error';
    title: string;
    message: string;
    read: boolean;
    actionUrl?: string | null;
    relatedEntityId?: string | null;
    timestamp: string;
}

function mapApiNotification(apiNotification: ApiNotification): Notification {
    return {
        id: apiNotification.id,
        type: apiNotification.type,
        title: apiNotification.title,
        message: apiNotification.message,
        read: apiNotification.read,
        timestamp: apiNotification.timestamp,
        actionUrl: apiNotification.actionUrl,
        relatedEntityId: apiNotification.relatedEntityId,
    };
}

export async function fetchNotificationsPage(
    idToken: string,
    options?: { unreadOnly?: boolean; limit?: number; page?: number }
): Promise<NotificationsPageResponse> {
    const query = new URLSearchParams();
    if (options?.unreadOnly) query.set('unreadOnly', 'true');
    if (options?.limit) query.set('limit', String(options.limit));
    if (options?.page) query.set('page', String(options.page));

    const queryString = query.toString();
    const url = `${getApiBaseUrl()}/notifications/v1${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${idToken}`,
        },
    });

    const json = await response.json();
    if (!response.ok) {
        throw new Error(json?.message || 'Failed to fetch notifications');
    }

    const data = json?.data || {};
    return {
        notifications: ((data.items || []) as ApiNotification[]).map(mapApiNotification),
        pagination: (data.pagination || {
            page: options?.page || 1,
            limit: options?.limit || 20,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
        }) as NotificationPagination,
    };
}

export async function fetchNotifications(
    idToken: string,
    options?: { unreadOnly?: boolean; limit?: number; page?: number }
): Promise<Notification[]> {
    const result = await fetchNotificationsPage(idToken, options);
    return result.notifications;
}

export async function fetchUnreadNotificationCount(idToken: string): Promise<number> {
    const response = await fetch(`${getApiBaseUrl()}/notifications/v1/unread-count`, {
        headers: {
            Authorization: `Bearer ${idToken}`,
        },
    });

    const json = await response.json();
    if (!response.ok) {
        throw new Error(json?.message || 'Failed to fetch unread notification count');
    }

    return Number(json?.data?.unreadCount || 0);
}

export async function markNotificationAsRead(
    idToken: string,
    notificationId: string
): Promise<void> {
    const response = await fetch(`${getApiBaseUrl()}/notifications/v1/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${idToken}`,
            'Content-Type': 'application/json',
        },
    });

    const json = await response.json();
    if (!response.ok) {
        throw new Error(json?.message || 'Failed to mark notification as read');
    }
}

export async function markAllNotificationsAsRead(idToken: string): Promise<void> {
    const response = await fetch(`${getApiBaseUrl()}/notifications/v1/read-all`, {
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${idToken}`,
            'Content-Type': 'application/json',
        },
    });

    const json = await response.json();
    if (!response.ok) {
        throw new Error(json?.message || 'Failed to mark all notifications as read');
    }
}
