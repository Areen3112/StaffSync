import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserProfile, UserRole } from '@/types';

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true, // starts true during initial session check
  error: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: UserProfile; token?: string }>
    ) => {
      state.user = action.payload.user;
      if (action.payload.token) {
        state.token = action.payload.token;
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('staffsync_auth_token', action.payload.token);
          sessionStorage.setItem('staffsync_demo_role', action.payload.user.role);
        }
      }
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    },
    switchRoleDemo: (state, action: PayloadAction<UserRole>) => {
      if (state.user) {
        state.user.role = action.payload;
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('staffsync_demo_role', action.payload);
        }
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('staffsync_auth_token');
        sessionStorage.removeItem('staffsync_demo_role');
      }
    },
  },
});

export const { setCredentials, switchRoleDemo, setLoading, setError, logout } = authSlice.actions;
export default authSlice.reducer;
