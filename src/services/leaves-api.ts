import { apiClient, IS_DEMO_FALLBACK } from './api-client';
import { LeaveRequest, LeaveBalance, LeaveStatus, PaginationMeta } from '@/types';
import { MOCK_LEAVES, MOCK_LEAVE_BALANCE } from './mock-data';

let localLeaves = [...MOCK_LEAVES];
let localBalance = { ...MOCK_LEAVE_BALANCE };

export interface ApplyLeavePayload {
  leaveType: LeaveRequest['leaveType'];
  startDate: string;
  endDate: string;
  reason: string;
}

export const leavesApi = {
  getAll: async (params?: { status?: string; employeeId?: string; page?: number; limit?: number }): Promise<{ leaves: LeaveRequest[]; balance: LeaveBalance } & PaginationMeta> => {
    try {
      const response = await apiClient.get('/leaves', { params });
      return response.data;
    } catch (error) {
      if (IS_DEMO_FALLBACK) {
        let list = [...localLeaves];
        if (params?.status && params.status !== 'all') {
          list = list.filter((l) => l.status === params.status);
        }
        if (params?.employeeId) {
          list = list.filter((l) => l.employeeId === params.employeeId);
        }
        const page = params?.page ?? 1;
        const limit = params?.limit ?? 25;
        const total = list.length;
        return { leaves: list.slice((page - 1) * limit, page * limit), balance: localBalance, page, limit, total, pages: Math.ceil(total / limit) };
      }
      throw error;
    }
  },

  apply: async (payload: ApplyLeavePayload): Promise<LeaveRequest> => {
    try {
      const response = await apiClient.post('/leaves', payload);
      return response.data.leave;
    } catch (error) {
      if (IS_DEMO_FALLBACK) {
        // Calculate days
        const start = new Date(payload.startDate);
        const end = new Date(payload.endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const daysCount = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

        const newLeave: LeaveRequest = {
          id: `lv_${Date.now()}`,
          employeeId: 'usr_emp_01',
          employeeName: 'Aria Chen',
          department: 'Engineering',
          leaveType: payload.leaveType,
          startDate: payload.startDate,
          endDate: payload.endDate,
          daysCount,
          reason: payload.reason,
          status: 'pending',
          appliedAt: new Date().toISOString().split('T')[0],
        };
        localLeaves.unshift(newLeave);
        return newLeave;
      }
      throw error;
    }
  },

  decide: async (id: string, decision: { status: LeaveStatus; reviewerComment?: string }): Promise<LeaveRequest> => {
    try {
      const response = await apiClient.patch(`/leaves/${id}/decision`, decision);
      return response.data.leave;
    } catch (error) {
      if (IS_DEMO_FALLBACK) {
        const idx = localLeaves.findIndex((l) => l.id === id);
        if (idx !== -1) {
          localLeaves[idx] = {
            ...localLeaves[idx],
            status: decision.status,
            reviewerComment: decision.reviewerComment,
            reviewedAt: new Date().toISOString().split('T')[0],
            reviewerName: 'Marcus Sterling',
          };
          if (decision.status === 'approved') {
            const days = localLeaves[idx].daysCount;
            localBalance.remaining = Math.max(0, localBalance.remaining - days);
          }
          return localLeaves[idx];
        }
      }
      throw error;
    }
  },
};
