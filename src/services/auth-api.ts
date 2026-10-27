import { apiClient, IS_DEMO_FALLBACK } from './api-client';
import { UserProfile, UserRole } from '@/types';
import { MOCK_USERS } from './mock-data';

export interface LoginCredentials {
  email: string;
  password?: string;
  roleHint?: UserRole;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  department: string;
}

export const authApi = {
  updateProfile: async (data: { name: string; phone: string }): Promise<UserProfile> => {
    const response = await apiClient.patch('/auth/profile', data);
    return response.data.user;
  },

  updatePassword: async (data: { currentPassword: string; newPassword: string }): Promise<void> => {
    await apiClient.patch('/auth/password', data);
  },

  login: async (credentials: LoginCredentials): Promise<{ user: UserProfile; token?: string }> => {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      if (IS_DEMO_FALLBACK) {
        // Resolve user based on email or role
        const role: UserRole = credentials.roleHint || (credentials.email.includes('hr') ? 'hr' : credentials.email.includes('manager') ? 'manager' : 'employee');
        const mockUser = MOCK_USERS[role] || MOCK_USERS['employee'];
        return {
          user: mockUser,
          token: `demo-jwt-token-${mockUser.role}-${Date.now()}`,
        };
      }
      throw error;
    }
  },

  register: async (payload: RegisterPayload): Promise<{ user: UserProfile; token?: string }> => {
    try {
      const response = await apiClient.post('/auth/register', payload);
      return response.data;
    } catch (error) {
      if (IS_DEMO_FALLBACK) {
        const newUser: UserProfile = {
          id: `usr_${Date.now()}`,
          name: payload.name,
          email: payload.email,
          role: payload.role,
          department: payload.department,
          designation: `${payload.department} Associate`,
          joiningDate: new Date().toISOString().split('T')[0],
        };
        return {
          user: newUser,
          token: `demo-jwt-token-${newUser.role}-${Date.now()}`,
        };
      }
      throw error;
    }
  },

  getCurrentUser: async (): Promise<UserProfile> => {
    try {
      const response = await apiClient.get('/auth/me');
      return response.data.user;
    } catch (error) {
      if (IS_DEMO_FALLBACK) {
        // Check stored session role
        if (typeof window !== 'undefined') {
          const storedRole = (sessionStorage.getItem('staffsync_demo_role') as UserRole) || 'employee';
          return MOCK_USERS[storedRole] || MOCK_USERS['employee'];
        }
        return MOCK_USERS['employee'];
      }
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('staffsync_auth_token');
        sessionStorage.removeItem('staffsync_demo_role');
      }
    }
  },
};
