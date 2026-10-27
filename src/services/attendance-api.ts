import { apiClient, IS_DEMO_FALLBACK } from './api-client';
import { AttendanceRecord, PaginationMeta } from '@/types';
import { MOCK_ATTENDANCE } from './mock-data';

let localAttendance = [...MOCK_ATTENDANCE];

export const attendanceApi = {
  getToday: async (): Promise<AttendanceRecord | null> => {
    try {
      const response = await apiClient.get('/attendance/today');
      return response.data.todayStatus;
    } catch (error) {
      if (IS_DEMO_FALLBACK) {
        const todayStr = new Date().toISOString().split('T')[0];
        const record = localAttendance.find((a) => a.date === todayStr);
        return record || null;
      }
      throw error;
    }
  },

  getAll: async (params?: { date?: string; startDate?: string; endDate?: string; employeeId?: string; page?: number; limit?: number }): Promise<{ records: AttendanceRecord[] } & PaginationMeta> => {
    try {
      const response = await apiClient.get('/attendance', { params });
      return response.data.records;
    } catch (error) {
      if (IS_DEMO_FALLBACK) {
        let list = [...localAttendance];
        if (params?.date) {
          list = list.filter((r) => r.date === params.date);
        }
        if (params?.employeeId) {
          list = list.filter((r) => r.employeeId === params.employeeId);
        }
        const page = params?.page ?? 1;
        const limit = params?.limit ?? 25;
        const total = list.length;
        return { records: list.slice((page - 1) * limit, page * limit), page, limit, total, pages: Math.ceil(total / limit) };
      }
      throw error;
    }
  },

  clockIn: async (): Promise<AttendanceRecord> => {
    try {
      const response = await apiClient.post('/attendance/clock-in');
      return response.data.attendance;
    } catch (error) {
      if (IS_DEMO_FALLBACK) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const todayStr = now.toISOString().split('T')[0];

        const existingIdx = localAttendance.findIndex((a) => a.date === todayStr);
        if (existingIdx !== -1) {
          localAttendance[existingIdx].clockIn = timeStr;
          localAttendance[existingIdx].status = 'present';
          return localAttendance[existingIdx];
        }

        const newRecord: AttendanceRecord = {
          id: `att_${Date.now()}`,
          employeeId: 'usr_emp_01',
          employeeName: 'Aria Chen',
          department: 'Engineering',
          date: todayStr,
          clockIn: timeStr,
          clockOut: null,
          status: 'present',
          workingHours: 0,
        };
        localAttendance.unshift(newRecord);
        return newRecord;
      }
      throw error;
    }
  },

  clockOut: async (): Promise<AttendanceRecord> => {
    try {
      const response = await apiClient.post('/attendance/clock-out');
      return response.data.attendance;
    } catch (error) {
      if (IS_DEMO_FALLBACK) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const todayStr = now.toISOString().split('T')[0];

        const record = localAttendance.find((a) => a.date === todayStr);
        if (record) {
          record.clockOut = timeStr;
          record.workingHours = 8;
          return record;
        }

        throw new Error('No clock-in record found for today');
      }
      throw error;
    }
  },
};
