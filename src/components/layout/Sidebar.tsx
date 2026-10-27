'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store/provider';
import { toggleSidebar } from '@/store/slices/uiSlice';
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarDays,
  BellRing,
  GraduationCap,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import styles from './Sidebar.module.scss';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { sidebarCollapsed } = useAppSelector((state) => state.ui);

  const role = user?.role || 'employee';

  const navItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['hr', 'manager', 'employee'],
    },
    {
      label: role === 'manager' ? 'Team Directory' : 'Employees',
      href: '/employees',
      icon: Users,
      roles: ['hr', 'manager'],
    },
    {
      label: 'Attendance',
      href: '/attendance',
      icon: Clock,
      roles: ['hr', 'manager', 'employee'],
    },
    {
      label: 'Leaves',
      href: '/leaves',
      icon: CalendarDays,
      roles: ['hr', 'manager', 'employee'],
    },
    {
      label: 'Announcements',
      href: '/announcements',
      icon: BellRing,
      roles: ['hr', 'manager', 'employee'],
    },
    {
      label: 'Trainings',
      href: '/trainings',
      icon: GraduationCap,
      roles: ['hr', 'manager', 'employee'],
    },
    {
      label: 'Reports',
      href: '/reports',
      icon: BarChart3,
      roles: ['hr', 'manager'],
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: Settings,
      roles: ['hr', 'manager', 'employee'],
    },
  ];

  const authorizedNavItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ''}`}>
      <div className={styles.topSection}>
        <Link href="/dashboard" className={styles.logoLink}>
          <div className={styles.logoIcon}>
            <ShieldCheck size={22} className={styles.shield} />
          </div>
          {!sidebarCollapsed && (
            <div className={styles.brandText}>
              <span className={styles.brandTitle}>StaffSync</span>
              <span className={styles.brandSubtitle}>Enterprise HRMS</span>
            </div>
          )}
        </Link>
        <button
          className={styles.collapseToggle}
          onClick={() => dispatch(toggleSidebar())}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className={styles.navMenu}>
        <div className={styles.navSectionLabel}>
          {!sidebarCollapsed && <span>MAIN NAVIGATION</span>}
        </div>
        <ul className={styles.navList}>
          {authorizedNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <li key={item.href} className={styles.navItem}>
                <Link
                  href={item.href}
                  className={`${styles.navLink} ${isActive ? styles.active : ''}`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon size={19} className={styles.navIcon} />
                  {!sidebarCollapsed && <span className={styles.navLabel}>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {!sidebarCollapsed && (
        <div className={styles.footerCard}>
          <div className={styles.roleTag}>
            Role: <strong>{role.toUpperCase()}</strong>
          </div>
          <p className={styles.workspaceNote}>StaffSync v1.0 • College Final</p>
        </div>
      )}
    </aside>
  );
};
