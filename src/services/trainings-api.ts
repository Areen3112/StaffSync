import { apiClient, IS_DEMO_FALLBACK } from './api-client';
import { PaginationMeta, TrainingProgram } from '@/types';
import { MOCK_TRAININGS } from './mock-data';

let localTrainings = [...MOCK_TRAININGS];

export const trainingsApi = {
  getAll: async (params?: { page?: number; limit?: number; status?: 'all' | 'upcoming' | 'completed' }): Promise<{ trainings: TrainingProgram[] } & PaginationMeta> => {
    try {
      const response = await apiClient.get('/trainings', { params });
      return response.data;
    } catch (error) {
      if (IS_DEMO_FALLBACK) {
        let list = [...localTrainings];
        if (params?.status && params.status !== 'all') list = list.filter((item) => item.status === params.status);
        const page = params?.page ?? 1;
        const limit = params?.limit ?? 25;
        const total = list.length;
        return { trainings: list.slice((page - 1) * limit, page * limit), page, limit, total, pages: Math.ceil(total / limit) };
      }
      throw error;
    }
  },

  create: async (data: Omit<TrainingProgram, 'id' | 'enrolledCount' | 'status'>): Promise<TrainingProgram> => {
    try {
      const response = await apiClient.post('/trainings', data);
      return response.data.training;
    } catch (error) {
      if (IS_DEMO_FALLBACK) {
        const item: TrainingProgram = {
          ...data,
          id: `trn_${Date.now()}`,
          enrolledCount: 0,
          status: 'upcoming',
        };
        localTrainings.unshift(item);
        return item;
      }
      throw error;
    }
  },

  enroll: async (id: string): Promise<TrainingProgram> => {
    try {
      const response = await apiClient.post(`/trainings/${id}/enroll`);
      return response.data.training;
    } catch (error) {
      if (IS_DEMO_FALLBACK) {
        const item = localTrainings.find((t) => t.id === id);
        if (item) {
          item.isEnrolled = true;
          item.enrolledCount = Math.min(item.capacity, item.enrolledCount + 1);
          return item;
        }
      }
      throw error;
    }
  },
};
