import {
    X,
    CheckCircle,
    AlertTriangle,
    Info,
    Clock,
    ChevronLeft,
    ChevronRight,
    Loader2,
} from 'lucide-react';
import { useState } from 'react';
import type { NotificationPagination } from '../lib/notifications';

export interface Notification {
    id: string;
    type: 'success' | 'warning' | 'info' | 'error';
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
}

interface NotificationsModalProps {
    notifications: Notification[];
    pagination?: NotificationPagination;
    onClose: () => void;
    onMarkAsRead: (id: string) => void | Promise<void>;
    onMarkAllAsRead: () => void | Promise<void>;
    onPrevPage?: () => void | Promise<void>;
    onNextPage?: () => void | Promise<void>;
    isLoading?: boolean;
}

export function NotificationsModal({
    notifications,
    pagination,
    onClose,
    onMarkAsRead,
    onMarkAllAsRead,
    onPrevPage,
    onNextPage,
    isLoading = false,
}: NotificationsModalProps) {
    const [markingNotificationId, setMarkingNotificationId] = useState<string | null>(null);
    const [isMarkAllLoading, setIsMarkAllLoading] = useState(false);
    const [pageTransition, setPageTransition] = useState<'prev' | 'next' | null>(null);
    const unreadCount = notifications.filter(n => !n.read).length;
    const isActionBusy =
        isLoading || isMarkAllLoading || Boolean(markingNotificationId) || Boolean(pageTransition);

    const getIcon = (type: string) => {
        switch (type) {
            case 'success':
                return <CheckCircle className="size-5 text-green-600" />;
            case 'warning':
                return <AlertTriangle className="size-5 text-amber-600" />;
            case 'error':
                return <AlertTriangle className="size-5 text-red-600" />;
            default:
                return <Info className="size-5 text-blue-600" />;
        }
    };

    const getTimeAgo = (timestamp: string) => {
        const now = new Date();
        const time = new Date(timestamp);
        const diffMs = now.getTime() - time.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return time.toLocaleDateString();
    };

    const handleMarkAsRead = async (id: string, isRead: boolean) => {
        if (isRead || isActionBusy) return;
        setMarkingNotificationId(id);
        try {
            await onMarkAsRead(id);
        } finally {
            setMarkingNotificationId(null);
        }
    };

    const handleMarkAllAsRead = async () => {
        if (unreadCount === 0 || isActionBusy) return;
        setIsMarkAllLoading(true);
        try {
            await onMarkAllAsRead();
        } finally {
            setIsMarkAllLoading(false);
        }
    };

    const handlePrevPage = async () => {
        if (!onPrevPage || !pagination?.hasPrevPage || isActionBusy) return;
        setPageTransition('prev');
        try {
            await onPrevPage();
        } finally {
            setPageTransition(null);
        }
    };

    const handleNextPage = async () => {
        if (!onNextPage || !pagination?.hasNextPage || isActionBusy) return;
        setPageTransition('next');
        try {
            await onNextPage();
        } finally {
            setPageTransition(null);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <div>
                        <h2 className="mb-1">Notifications</h2>
                        {unreadCount > 0 && (
                            <p className="text-sm text-gray-600">
                                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                            <button
                                onClick={() => {
                                    void handleMarkAllAsRead();
                                }}
                                disabled={isActionBusy}
                                className="text-sm text-indigo-600 hover:text-indigo-700 px-3 py-1 rounded hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isMarkAllLoading ? 'Marking...' : 'Mark all as read'}
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            disabled={isActionBusy}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <X className="size-5" />
                        </button>
                    </div>
                </div>

                {/* Notifications List */}
                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                            <Clock className="size-12 mb-3 text-gray-400 animate-pulse" />
                            <p>Loading notifications</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                            <Info className="size-12 mb-3 text-gray-400" />
                            <p>No notifications</p>
                            <p className="text-sm">You're all caught up!</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {notifications.map(notification => (
                                <div
                                    key={notification.id}
                                    className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                                        !notification.read ? 'bg-blue-50' : ''
                                    }`}
                                    onClick={() => {
                                        void handleMarkAsRead(notification.id, notification.read);
                                    }}
                                >
                                    <div className="flex items-start gap-3">
                                        {getIcon(notification.type)}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <p
                                                    className={`${!notification.read ? 'font-medium' : ''}`}
                                                >
                                                    {notification.title}
                                                </p>
                                                {markingNotificationId === notification.id && (
                                                    <Loader2 className="size-3.5 text-blue-600 animate-spin shrink-0 mt-0.5" />
                                                )}
                                                {!notification.read && (
                                                    <span className="w-2 h-2 bg-blue-600 rounded-full shrink-0 mt-1.5"></span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 mb-2">
                                                {notification.message}
                                            </p>
                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                <Clock className="size-3" />
                                                {getTimeAgo(notification.timestamp)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {pagination && pagination.totalPages > 1 && (
                    <div className="border-t border-gray-200 p-4 flex items-center justify-between gap-3 bg-gray-50">
                        <button
                            onClick={() => {
                                void handlePrevPage();
                            }}
                            disabled={!pagination.hasPrevPage || isActionBusy}
                            className="inline-flex items-center gap-1 px-3 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            {pageTransition === 'prev' ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <ChevronLeft className="size-4" />
                            )}
                            Previous
                        </button>
                        <p className="text-sm text-gray-500">
                            Page {pagination.page} of {pagination.totalPages} ·{' '}
                            {notifications.length} shown
                        </p>
                        <button
                            onClick={() => {
                                void handleNextPage();
                            }}
                            disabled={!pagination.hasNextPage || isActionBusy}
                            className="inline-flex items-center gap-1 px-3 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            {pageTransition === 'next' ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : null}
                            Next
                            {pageTransition !== 'next' ? <ChevronRight className="size-4" /> : null}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
