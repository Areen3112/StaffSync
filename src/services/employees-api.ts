import { apiClient, IS_DEMO_FALLBACK } from './api-client';
import { Employee, PaginationMeta } from '@/types';
import { MOCK_EMPLOYEES } from './mock-data';

// In-memory demo store
let localEmployees = [...MOCK_EMPLOYEES];

export interface EmployeeFilters {
  search?: string;
  department?: string;
  role?: string;
  page?: number;
  limit?: number;
}

export const employeesApi = {
  getAll: async (filters?: EmployeeFilters): Promise<{ employees: Employee[] } & PaginationMeta> => {
    try {
      const response = await apiClient.get('/employees', { params: filters });
      return response.data;
    } catch (error) {
      if (IS_DEMO_FALLBACK) {
        let list = [...localEmployees];
        if (filters?.search) {
          const q = filters.search.toLowerCase();
          list = list.filter((e) => e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q) || e.designation.toLowerCase().includes(q));
        }
        if (filters?.department && filters.department !== 'all') {
          list = list.filter((e) => e.department.toLowerCase() === filters.department?.toLowerCase());
        }
        if (filters?.role && filters.role !== 'all') {
          list = list.filter((e) => e.role === filters.role);
        }
        const page = filters?.page ?? 1;
        const limit = filters?.limit ?? 25;
        const total = list.length;
        return { employees: list.slice((page - 1) * limit, page * limit), page, limit, total, pages: Math.ceil(total / limit) };
      }
      throw error;
    }
  },

  getById: async (id: string): Promise<Employee> => {
    try {
      const response = await apiClient.get(`/employees/${id}`);
      return response.data.employee;
    } catch (error) {
      if (IS_DEMO_FALLBACK) {
        const found = localEmployees.find((e) => e.id === id);
        if (found) return found;
      }
      throw error;
    }
  },

  create: async (data: Omit<Employee, 'id'> & { password: string }): Promise<Employee> => {
    try {
      const response = await apiClient.post('/employees', data);
      return response.data.employee;
    } catch (error) {
      if (IS_DEMO_FALLBACK) {
        const newEmployee: Employee = {
          ...data,
          id: `emp_${Date.now()}`,
        };
        localEmployees.unshift(newEmployee);
        return newEmployee;
      }
      throw error;
    }
  },

  update: async (id: string, updates: Partial<Employee>): Promise<Employee> => {
    try {
      const response = await apiClient.patch(`/employees/${id}`, updates);
      return response.data.employee;
    } catch (error) {
      if (IS_DEMO_FALLBACK) {
        const idx = localEmployees.findIndex((e) => e.id === id);
        if (idx !== -1) {
          localEmployees[idx] = { ...localEmployees[idx], ...updates };
          return localEmployees[idx];
        }
      }
      throw error;
    }
  },
};
