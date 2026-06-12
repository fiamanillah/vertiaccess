import { apiClient } from '../api-client';
import type { 
  ListNotificationsResponse, 
  UnreadCountResponse, 
  AuthResponse 
} from './types';

/**
 * Notification Service
 * Handles all notification-related microservice calls.
 */
class NotificationService {
  private readonly BASE_PATH = '/notifications/v1';

  /**
   * List all notifications for the current user
   */
  async listNotifications(): Promise<ListNotificationsResponse> {
    return apiClient.get<ListNotificationsResponse>(this.BASE_PATH);
  }

  /**
   * Get the current unread count
   */
  async getUnreadCount(): Promise<UnreadCountResponse> {
    return apiClient.get<UnreadCountResponse>(`${this.BASE_PATH}/unread-count`);
  }

  /**
   * Mark a specific notification as read
   */
  async markAsRead(id: string): Promise<AuthResponse> {
    return apiClient.patch<AuthResponse>(`${this.BASE_PATH}/${id}/read`, {});
  }

  /**
   * Mark all notifications as read for the current user
   */
  async markAllAsRead(): Promise<AuthResponse> {
    return apiClient.patch<AuthResponse>(`${this.BASE_PATH}/read-all`, {});
  }

  /**
   * Create a new notification (Admin only)
   */
  async createNotification(payload: {
    userId: string;
    type: 'success' | 'warning' | 'info' | 'error';
    title: string;
    message: string;
    actionUrl?: string;
    relatedEntityId?: string;
  }): Promise<any> {
    return apiClient.post<any>(this.BASE_PATH, payload);
  }

  /**
   * Delete a notification
   */
  async deleteNotification(id: string): Promise<AuthResponse> {
    return apiClient.delete<AuthResponse>(`${this.BASE_PATH}/${id}`);
  }
}

export const notificationService = new NotificationService();
