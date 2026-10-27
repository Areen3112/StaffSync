import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface UiState {
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;
  toasts: ToastMessage[];
}

const initialState: UiState = {
  sidebarCollapsed: false,
  mobileMenuOpen: false,
  toasts: [],
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    toggleMobileMenu: (state) => {
      state.mobileMenuOpen = !state.mobileMenuOpen;
    },
    setMobileMenuOpen: (state, action: PayloadAction<boolean>) => {
      state.mobileMenuOpen = action.payload;
    },
    addToast: (state, action: PayloadAction<Omit<ToastMessage, 'id'>>) => {
      state.toasts.push({
        id: `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        ...action.payload,
      });
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
  },
});

export const {
  toggleSidebar,
  setSidebarCollapsed,
  toggleMobileMenu,
  setMobileMenuOpen,
  addToast,
  removeToast,
} = uiSlice.actions;

export default uiSlice.reducer;
