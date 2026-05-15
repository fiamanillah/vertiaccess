export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'security' | 'billing';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  timestamp: string;
}

export interface ListNotificationsResponse {
  success: boolean;
  data: {
    items: Notification[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
  message?: string;
}

export interface UnreadCountResponse {
  success: boolean;
  data: {
    unreadCount: number;
  };
  message?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: any;
}
