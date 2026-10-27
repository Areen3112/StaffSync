'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store/provider';
import { setCredentials, logout } from '@/store/slices/authSlice';
import { addToast } from '@/store/slices/uiSlice';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { authApi } from '@/services/auth-api';
import {
  User,
  Mail,
  Phone,
  Building,
  Shield,
  KeyRound,
  LogOut,
  Save,
  CheckCircle2,
} from 'lucide-react';
import styles from './settings.module.scss';

export default function SettingsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '+1 (555) 019-2834');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSaving) return;
    setIsSaving(true);
    try {
      const updatedUser = await authApi.updateProfile({ name, phone });
      dispatch(setCredentials({ user: { ...user, ...updatedUser } }));
      dispatch(addToast({ type: 'success', message: 'Profile information updated successfully.' }));
    } catch {
      dispatch(addToast({ type: 'error', message: 'Profile could not be saved. Please try again.' }));
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    if (!currentPassword || !newPassword) {
      dispatch(addToast({ type: 'error', message: 'Please provide both passwords.' }));
      return;
    }
    if (newPassword.length < 8) {
      dispatch(addToast({ type: 'error', message: 'New password must be at least 8 characters.' }));
      return;
    }
    if (newPassword !== confirmPassword) {
      dispatch(addToast({ type: 'error', message: 'New passwords do not match.' }));
      return;
    }
    setIsSaving(true);
    try {
      await authApi.updatePassword({ currentPassword, newPassword });
      dispatch(addToast({ type: 'success', message: 'Security credentials updated successfully.' }));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      dispatch(addToast({ type: 'error', message: 'Password could not be updated. Check your current password and try again.' }));
    } finally {
      setIsSaving(false);
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

  return (
    <AuthGuard>
      <AppLayout>
        <div className={styles.container}>
          {/* Header */}
          <div className={styles.pageHeader}>
            <div>
              <h2 className={styles.pageTitle}>Account Settings & Preferences</h2>
              <p className={styles.pageSubtitle}>
                Manage your profile details, corporate credentials, and security settings.
              </p>
            </div>

            <button className={`${styles.logoutBtn}`} onClick={handleLogout}>
              <LogOut size={15} /> Sign Out of StaffSync
            </button>
          </div>

          <div className={styles.grid}>
            {/* Left Card: Personal Profile */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Personal Information</h3>
                <span className={styles.cardSub}>Editable workforce contact data</span>
              </div>

              <form onSubmit={handleProfileSave} className={styles.form}>
                <div className={styles.avatarRow}>
                  <div className={styles.avatarLarge}>
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <h4 className={styles.profileName}>{user?.name}</h4>
                    <span className={styles.profileRole}>
                      {user?.designation} • {user?.department}
                    </span>
                    <span className="badge badge-success" style={{ marginTop: 6 }}>
                      {user?.role.toUpperCase()} ACCESS
                    </span>
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label>Full Legal Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label>Corporate Email (Protected)</label>
                  <input type="email" value={user?.email || ''} disabled className={styles.disabledInput} />
                  <span className={styles.fieldHint}>
                    Managed by People Operations IT governance.
                  </span>
                </div>

                <div className={styles.fieldGroup}>
                  <label>Contact Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label>Assigned Department</label>
                  <input
                    type="text"
                    value={user?.department || ''}
                    disabled
                    className={styles.disabledInput}
                  />
                </div>

                <button type="submit" className="pill-btn-primary" disabled={isSaving}>
                  <Save size={15} /> {isSaving ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </form>
            </div>

            {/* Right Card: Security Credentials & Admin Controls */}
            <div className={styles.securityStack}>
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>Security & Credentials</h3>
                  <span className={styles.cardSub}>Update your account authorization password</span>
                </div>

                <form onSubmit={handlePasswordUpdate} className={styles.form}>
                  <div className={styles.fieldGroup}>
                    <label>Current Password</label>
                    <input
                      type="password"
                      placeholder="••••••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label>New Password</label>
                    <input
                      type="password"
                      placeholder="Minimum 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="pill-btn-secondary" disabled={isSaving}>
                    <KeyRound size={15} /> Update Credentials
                  </button>
                </form>
              </div>

              {/* Administrative Compliance Badge */}
              <div className={styles.complianceCard}>
                <div className={styles.complianceHeader}>
                  <Shield size={18} className={styles.shieldIcon} />
                  <span>Enterprise Security Compliance</span>
                </div>
                <p className={styles.complianceText}>
                  Sessions are governed with role-level cryptographic tokens. Automatic inactivity
                  timeout is enabled after 8 hours of continuous idle time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
