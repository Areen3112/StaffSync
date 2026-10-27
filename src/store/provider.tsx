'use client';

import React, { useEffect } from 'react';
import { Provider, TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { store, RootState, AppDispatch } from './index';
import { setCredentials, setLoading } from './slices/authSlice';
import { authApi } from '@/services/auth-api';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

function SessionInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const user = await authApi.getCurrentUser();
        if (user) {
          const token = typeof window !== 'undefined' ? sessionStorage.getItem('staffsync_auth_token') || undefined : undefined;
          dispatch(setCredentials({ user, token }));
        } else {
          dispatch(setLoading(false));
        }
      } catch {
        dispatch(setLoading(false));
      }
    };

    restoreSession();
  }, [dispatch]);

  return <>{children}</>;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <SessionInitializer>{children}</SessionInitializer>
    </Provider>
  );
}
