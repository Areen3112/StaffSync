'use client';

import React from 'react';
import { useAppDispatch, useAppSelector } from '@/store/provider';
import { removeToast } from '@/store/slices/uiSlice';
import { CheckCircle2, AlertTriangle, AlertCircle, X } from 'lucide-react';
import styles from './ToastContainer.module.scss';

export const ToastContainer: React.FC = () => {
  const dispatch = useAppDispatch();
  const toasts = useAppSelector((state) => state.ui.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className={styles.toastViewport}>
      {toasts.map((toast) => (
        <div key={toast.id} className={`${styles.toastItem} ${styles[toast.type]}`}>
          <div className={styles.icon}>
            {toast.type === 'success' && <CheckCircle2 size={18} />}
            {toast.type === 'error' && <AlertCircle size={18} />}
            {toast.type === 'info' && <AlertTriangle size={18} />}
          </div>
          <span className={styles.message}>{toast.message}</span>
          <button
            className={styles.closeBtn}
            onClick={() => dispatch(removeToast(toast.id))}
            aria-label="Close notification"
          >
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  );
};
