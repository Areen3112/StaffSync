import { apiClient, IS_DEMO_FALLBACK } from './api-client';
import { PaginationMeta } from '@/types';

export interface AttendanceReportData {
  summary: {
    totalWorkDays: number;
    avgAttendanceRate: number | null;
    totalAbsences: number;
    totalLateArrivals: number;
  };
  monthlyTrends: { month: string; rate: number | null }[];
  departmentBreakdown: { department: string; rate: number | null }[];
}

export interface PerformanceIndicator {
  employeeId: string;
  name: string;
  department: string;
  designation: string;
  attendance: {
    recordedDays: number;
    presentDays: number;
    lateDays: number;
    explicitAbsenceDays: number;
    attendanceRate: number | null;
  };
  training: { enrollments: number; completed: number };
}

export interface PerformanceReportData extends PaginationMeta {
  period: { startDate: string; endDate: string };
  indicators: PerformanceIndicator[];
  note: string;
}

export interface LeaveReportData {
  summary: {
    totalApplications: number;
    approved: number;
    rejected: number;
    pending: number;
  };
  typeDistribution: { type: string; count: number }[];
  monthlyDistribution: { month: string; days: number }[];
}

export const reportsApi = {
  getAttendanceReport: async (params?: { startDate?: string; endDate?: string }): Promise<AttendanceReportData> => {
    try {
      const response = await apiClient.get('/reports/attendance', { params });
      return response.data;
    } catch (error) {
      if (IS_DEMO_FALLBACK) {
        return {
          summary: {
            totalWorkDays: 22,
            avgAttendanceRate: 94.8,
            totalAbsences: 14,
            totalLateArrivals: 8,
          },
          monthlyTrends: [
            { month: 'Jun', rate: 93 },
            { month: 'Jul', rate: 95 },
            { month: 'Aug', rate: 96 },
            { month: 'Sep', rate: 94 },
            { month: 'Oct', rate: 95 },
          ],
          departmentBreakdown: [
            { department: 'Engineering', rate: 96 },
            { department: 'People Operations', rate: 98 },
            { department: 'Design', rate: 93 },
            { department: 'Finance', rate: 94 },
            { department: 'Sales', rate: 91 },
          ],
        };
      }
      throw error;
    }
  },

  getLeaveReport: async (year?: number): Promise<LeaveReportData> => {
    try {
      const response = await apiClient.get('/reports/leaves', { params: { year } });
      return response.data;
    } catch (error) {
      if (IS_DEMO_FALLBACK) {
        return {
          summary: {
            totalApplications: 48,
            approved: 39,
            rejected: 4,
            pending: 5,
          },
          typeDistribution: [
            { type: 'Annual Leave', count: 22 },
            { type: 'Sick Leave', count: 14 },
            { type: 'Casual Leave', count: 9 },
            { type: 'Unpaid Leave', count: 3 },
          ],
          monthlyDistribution: [
            { month: 'Jun', days: 12 },
            { month: 'Jul', days: 18 },
            { month: 'Aug', days: 24 },
            { month: 'Sep', days: 15 },
            { month: 'Oct', days: 20 },
          ],
        };
      }
      throw error;
    }
  },

  getPerformanceReport: async (params?: { startDate?: string; endDate?: string; page?: number; limit?: number }): Promise<PerformanceReportData> => {
    const response = await apiClient.get('/reports/performance', { params });
    return response.data;
  },
};
