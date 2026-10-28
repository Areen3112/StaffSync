import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getApiErrorMessage } from './api-error.mjs';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
export const IS_DEMO_FALLBACK = process.env.NEXT_PUBLIC_ENABLE_DEMO_FALLBACK === 'true';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 8000,
  withCredentials: true, // Credentialed CORS compatibility; authentication currently uses the bearer token below.
});

// Request interceptor to attach bearer token if one exists in storage
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = sessionStorage.getItem('staffsync_auth_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for centralized error mapping
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    error.message = getApiErrorMessage(error);
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        // Clear session on unhandled 401
        sessionStorage.removeItem('staffsync_auth_token');
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  }
);

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
