import { apiClient, IS_DEMO_FALLBACK } from './api-client';
import { Announcement, PaginationMeta } from '@/types';
import { MOCK_ANNOUNCEMENTS } from './mock-data';

let localAnnouncements = [...MOCK_ANNOUNCEMENTS];

export const announcementsApi = {
  getAll: async (params?: { page?: number; limit?: number }): Promise<{ announcements: Announcement[] } & PaginationMeta> => {
    try {
      const response = await apiClient.get('/announcements', { params });
      return response.data;
    } catch (error) {
      if (IS_DEMO_FALLBACK) {
        const page = params?.page ?? 1;
        const limit = params?.limit ?? 25;
        const total = localAnnouncements.length;
        return { announcements: localAnnouncements.slice((page - 1) * limit, page * limit), page, limit, total, pages: Math.ceil(total / limit) };
      }
      throw error;
    }
  },

  create: async (data: Omit<Announcement, 'id' | 'createdAt'>): Promise<Announcement> => {
    try {
      const { authorName: _authorName, ...payload } = data;
      const response = await apiClient.post('/announcements', payload);
      return response.data.announcement;
    } catch (error) {
      if (IS_DEMO_FALLBACK) {
        const item: Announcement = {
          ...data,
          id: `ann_${Date.now()}`,
          createdAt: new Date().toISOString().split('T')[0],
        };
        localAnnouncements.unshift(item);
        return item;
      }
      throw error;
    }
  },
};
