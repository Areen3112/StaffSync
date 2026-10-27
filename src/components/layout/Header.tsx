'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store/provider';
import { logout, switchRoleDemo } from '@/store/slices/authSlice';
import { authApi } from '@/services/auth-api';
import { notificationsApi } from '@/services/notifications-api';
import { NotificationItem, UserRole } from '@/types';
import {
  Bell,
  CheckCheck,
  LogOut,
  User,
  ChevronDown,
  Layers,
  Sparkles,
} from 'lucide-react';
import styles from './Header.module.scss';

export const Header: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationPage, setNotificationPage] = useState(1);
  const [notificationPages, setNotificationPages] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Derive breadcrumb from pathname
  const getBreadcrumb = () => {
    if (!pathname || pathname === '/dashboard') return 'Overview';
    const segment = pathname.split('/')[1];
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await notificationsApi.getAll({ page: 1, limit: 20 });
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
        setNotificationPage(data.page);
        setNotificationPages(data.pages);
      } catch {
        // silent fail
      }
    };
    fetchNotifications();
  }, []);

  const handleLoadOlderNotifications = async () => {
    if (notificationPage >= notificationPages) return;
    try {
      const nextPage = notificationPage + 1;
      const data = await notificationsApi.getAll({ page: nextPage, limit: 20 });
      setNotifications((current) => [...current, ...data.notifications]);
      setNotificationPage(data.page);
    } catch {
      // Keep the current notification list visible if loading older items fails.
    }
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // silent
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
      dispatch(logout());
      router.push('/login');
    } catch {
      dispatch(logout());
      router.push('/login');
    }
  };

  const handleRoleSwitch = (newRole: UserRole) => {
    dispatch(switchRoleDemo(newRole));
    setProfileOpen(false);
  };

  return (
    <header className={styles.header}>
      <div className={styles.breadcrumbArea}>
        <span className={styles.systemName}>StaffSync</span>
        <span className={styles.separator}>/</span>
        <h1 className={styles.pageTitle}>{getBreadcrumb()}</h1>
      </div>

      <div className={styles.actionsArea}>
        {/* Role Switcher Pill for College Evaluation & Demo */}
        <div className={styles.roleSelectorPill}>
          <Layers size={14} className={styles.roleIcon} />
          <span className={styles.roleText}>Role:</span>
          <select
            value={user?.role || 'employee'}
            onChange={(e) => handleRoleSwitch(e.target.value as UserRole)}
            className={styles.roleSelect}
            title="Switch demo evaluation role"
          >
            <option value="hr">HR Administrator</option>
            <option value="manager">Team Manager</option>
            <option value="employee">Employee</option>
          </select>
        </div>

        {/* Notifications Dropdown */}
        <div className={styles.dropdownContainer} ref={notifRef}>
          <button
            className={`${styles.iconButton} ${notifOpen ? styles.active : ''}`}
            onClick={() => setNotifOpen(!notifOpen)}
            aria-label="View notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className={styles.badgeCount}>{unreadCount}</span>}
          </button>

          {notifOpen && (
            <div className={styles.dropdownMenu}>
              <div className={styles.dropdownHeader}>
                <span className={styles.dropdownTitle}>Notifications</span>
                {unreadCount > 0 && (
                  <button className={styles.markReadBtn} onClick={handleMarkAllRead}>
                    <CheckCheck size={14} /> Mark all read
                  </button>
                )}
              </div>
              <div className={styles.notificationList}>
                {notifications.length === 0 ? (
                  <p className={styles.emptyText}>No notifications yet.</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`${styles.notificationItem} ${!n.isRead ? styles.unread : ''}`}
                      onClick={() => {
                        notificationsApi.markAsRead(n.id);
                        setNotifications((prev) =>
                          prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item))
                        );
                        setUnreadCount((c) => Math.max(0, c - 1));
                      }}
                    >
                      <div className={styles.notifDot} />
                      <div className={styles.notifContent}>
                        <h4 className={styles.notifTitle}>{n.title}</h4>
                        <p className={styles.notifDesc}>{n.message}</p>
                        <span className={styles.notifTime}>{n.createdAt}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {notificationPage < notificationPages && (
                <button className={styles.markReadBtn} onClick={handleLoadOlderNotifications}>
                  Load older notifications
                </button>
              )}
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className={styles.dropdownContainer} ref={profileRef}>
          <button
            className={styles.profileTrigger}
            onClick={() => setProfileOpen(!profileOpen)}
            aria-label="User menu"
          >
            <div className={styles.avatar}>
              {user?.name ? user.name.charAt(0).toUpperCase() : <User size={16} />}
            </div>
            <div className={styles.userMeta}>
              <span className={styles.userName}>{user?.name || 'User'}</span>
              <span className={styles.userRoleBadge}>{user?.role?.toUpperCase()}</span>
            </div>
            <ChevronDown size={14} className={styles.chevron} />
          </button>

          {profileOpen && (
            <div className={`${styles.dropdownMenu} ${styles.profileMenu}`}>
              <div className={styles.profileCard}>
                <p className={styles.profileName}>{user?.name}</p>
                <p className={styles.profileEmail}>{user?.email}</p>
                <span className={styles.profileDept}>
                  {user?.designation} • {user?.department}
                </span>
              </div>
              <div className={styles.menuDivider} />
              <button
                className={styles.menuItem}
                onClick={() => {
                  setProfileOpen(false);
                  router.push('/settings');
                }}
              >
                <User size={16} /> Profile & Settings
              </button>
              <div className={styles.menuDivider} />
              <button className={`${styles.menuItem} ${styles.danger}`} onClick={handleLogout}>
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
