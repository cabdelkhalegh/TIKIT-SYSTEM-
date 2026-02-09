export type NotificationType = 'campaign' | 'collaboration' | 'payment' | 'system' | 'announcement';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface NotificationListResponse {
  data: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NotificationFilters {
  read?: boolean;
  type?: NotificationType;
  page?: number;
  limit?: number;
}

export interface UnreadCountResponse {
  count?: number;
  unreadCount?: number;
}

export interface NotificationPreferences {
  email: {
    campaign: boolean;
    collaboration: boolean;
    payment: boolean;
    system: boolean;
    announcement: boolean;
  };
  inApp: {
    campaign: boolean;
    collaboration: boolean;
    payment: boolean;
    system: boolean;
    announcement: boolean;
  };
  frequency: 'realtime' | 'daily' | 'weekly';
}
