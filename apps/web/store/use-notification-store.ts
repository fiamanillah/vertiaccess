import { create } from 'zustand';
import { notificationService } from '@/services/notification/notification.service';
import type { Notification } from '@/services/notification/types';
import { useAuthStore } from './use-auth-store';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isUnreadLoading: boolean;
  
  // Actions
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  isUnreadLoading: false,

  fetchNotifications: async () => {
    if (!useAuthStore.getState().isAuthenticated) return;
    if (get().isLoading) return;
    set({ isLoading: true });
    try {
      const response = await notificationService.listNotifications();
      if (response.success && response.data?.items) {
        const notifications = response.data.items;
        // Also update unread count from the full list to stay in sync
        const unreadCount = notifications.filter((n) => !n.read).length;
        set({ notifications, unreadCount });
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    if (!useAuthStore.getState().isAuthenticated) return;
    if (get().isUnreadLoading) return;
    set({ isUnreadLoading: true });
    try {
      const response = await notificationService.getUnreadCount();
      if (response.success && response.data) {
        set({ unreadCount: response.data.unreadCount });
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    } finally {
      set({ isUnreadLoading: false });
    }
  },

  markAsRead: async (id: string) => {
    try {
      const response = await notificationService.markAsRead(id);
      if (response.success) {
        const { notifications, unreadCount } = get();
        set({
          notifications: notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, unreadCount - 1),
        });
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      const response = await notificationService.markAllAsRead();
      if (response.success) {
        const { notifications } = get();
        set({
          notifications: notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        });
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  },

  deleteNotification: async (id: string) => {
    try {
      const response = await notificationService.deleteNotification(id);
      if (response.success) {
        const { notifications, unreadCount } = get();
        const notification = notifications.find((n) => n.id === id);
        set({
          notifications: notifications.filter((n) => n.id !== id),
          unreadCount: notification && !notification.read ? Math.max(0, unreadCount - 1) : unreadCount,
        });
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  },
}));
