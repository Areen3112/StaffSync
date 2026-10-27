'use client';

import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ToastContainer } from '@/components/ui/ToastContainer';
import styles from './AppLayout.module.scss';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className={styles.appShell}>
      <Sidebar />
      <div className={styles.mainViewport}>
        <Header />
        <main className={styles.contentContainer}>{children}</main>
      </div>
      <ToastContainer />
    </div>
  );
};
