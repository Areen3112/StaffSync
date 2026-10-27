import { apiClient, IS_DEMO_FALLBACK } from './api-client';
import { NotificationItem, PaginationMeta } from '@/types';
import { MOCK_NOTIFICATIONS } from './mock-data';

let localNotifications = [...MOCK_NOTIFICATIONS];

export const notificationsApi = {
  getAll: async (params?: { page?: number; limit?: number }): Promise<{ notifications: NotificationItem[]; unreadCount: number } & PaginationMeta> => {
    try {
      const response = await apiClient.get('/notifications', { params });
      return response.data;
    } catch (error) {
      if (IS_DEMO_FALLBACK) {
        const unreadCount = localNotifications.filter((n) => !n.isRead).length;
        const page = params?.page ?? 1;
        const limit = params?.limit ?? 25;
        const total = localNotifications.length;
        return { notifications: localNotifications.slice((page - 1) * limit, page * limit), unreadCount, page, limit, total, pages: Math.ceil(total / limit) };
      }
      throw error;
    }
  },

  markAsRead: async (id: string): Promise<void> => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
    } catch (error) {
      if (IS_DEMO_FALLBACK) {
        const item = localNotifications.find((n) => n.id === id);
        if (item) {
          item.isRead = true;
        }
        return;
      }
      throw error;
    }
  },

  markAllAsRead: async (): Promise<void> => {
    try {
      await apiClient.patch('/notifications/read-all');
    } catch (error) {
      if (IS_DEMO_FALLBACK) {
        localNotifications.forEach((n) => {
          n.isRead = true;
        });
        return;
      }
      throw error;
    }
  },
};
