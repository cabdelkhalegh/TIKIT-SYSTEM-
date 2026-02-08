import { apiClient } from '@/lib/api-client';
import type {
  Notification,
  NotificationListResponse,
  NotificationFilters,
  UnreadCountResponse,
} from '@/types/notification.types';

export const notificationService = {
  async list(filters?: NotificationFilters): Promise<NotificationListResponse> {
    const params = new URLSearchParams();
    if (filters?.read !== undefined) params.append('read', String(filters.read));
    if (filters?.type) params.append('type', filters.type);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));

    const response = await apiClient.get<NotificationListResponse>(
      `/notifications${params.toString() ? `?${params.toString()}` : ''}`
    );
    return response.data;
  },

  async getById(id: string): Promise<Notification> {
    const response = await apiClient.get<Notification>(`/notifications/${id}`);
    return response.data;
  },

  async markAsRead(id: string): Promise<Notification> {
    const response = await apiClient.patch<Notification>(`/notifications/${id}/read`);
    return response.data;
  },

  async markAllAsRead(): Promise<void> {
    await apiClient.patch('/notifications/mark-all-read');
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/notifications/${id}`);
  },

  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get<UnreadCountResponse>('/notifications/unread-count');
    return response.data.unreadCount ?? response.data.count ?? 0;
  },
};
