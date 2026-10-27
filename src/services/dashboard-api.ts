import { apiClient, IS_DEMO_FALLBACK } from './api-client';
import {
  HRDashboardMetrics,
  ManagerDashboardMetrics,
  EmployeeDashboardMetrics,
} from '@/types';
import {
  MOCK_HR_DASHBOARD,
  MOCK_MANAGER_DASHBOARD,
  MOCK_EMPLOYEE_DASHBOARD,
} from './mock-data';

export const dashboardApi = {
  getHRDashboard: async (): Promise<HRDashboardMetrics> => {
    try {
      const response = await apiClient.get('/dashboard/hr');
      return response.data;
    } catch (error) {
      if (IS_DEMO_FALLBACK) {
        return MOCK_HR_DASHBOARD;
      }
      throw error;
    }
  },

  getManagerDashboard: async (): Promise<ManagerDashboardMetrics> => {
    try {
      const response = await apiClient.get('/dashboard/manager');
      return response.data;
    } catch (error) {
      if (IS_DEMO_FALLBACK) {
        return MOCK_MANAGER_DASHBOARD;
      }
      throw error;
    }
  },

  getEmployeeDashboard: async (): Promise<EmployeeDashboardMetrics> => {
    try {
      const response = await apiClient.get('/dashboard/employee');
      return response.data;
    } catch (error) {
      if (IS_DEMO_FALLBACK) {
        return MOCK_EMPLOYEE_DASHBOARD;
      }
      throw error;
    }
  },
};
