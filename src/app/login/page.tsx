'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/provider';
import { setCredentials, setError } from '@/store/slices/authSlice';
import { addToast } from '@/store/slices/uiSlice';
import { authApi } from '@/services/auth-api';
import { getApiErrorMessage } from '@/services/api-error.mjs';
import { UserRole } from '@/types';
import { ShieldCheck, Eye, EyeOff, ArrowRight, Lock, Mail, Sparkles } from 'lucide-react';
import styles from './login.module.scss';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const initialRole = (searchParams.get('role') as UserRole) || 'hr';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Quick fill preset credentials based on role
  useEffect(() => {
    if (selectedRole === 'hr') {
      setEmail('hr@staffsync.demo');
    } else if (selectedRole === 'manager') {
      setEmail('manager@staffsync.demo');
    } else {
      setEmail('employee@staffsync.demo');
    }
  }, [selectedRole]);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email || !password) {
      setFormError('Please enter both email address and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await authApi.login({
        email,
        password,
        roleHint: selectedRole,
      });

      dispatch(setCredentials(data));
      dispatch(
        addToast({
          type: 'success',
          message: `Welcome back, ${data.user.name} (${data.user.role.toUpperCase()})`,
        })
      );
      router.push('/dashboard');
    } catch (err: unknown) {
      const errorMsg = getApiErrorMessage(err, 'login');
      setFormError(errorMsg);
      dispatch(setError(errorMsg));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.authCard}>
      <div className={styles.cardHeader}>
        <Link href="/" className={styles.brandBadge}>
          <div className={styles.brandIcon}>
            <ShieldCheck size={20} />
          </div>
          <span className={styles.brandName}>StaffSync</span>
        </Link>
        <h1 className={styles.headline}>Sign In</h1>
        <p className={styles.subline}>Access your role-governed enterprise workspace</p>
      </div>

      {/* Demo Fast-Login Preset Buttons */}
      <div className={styles.demoPresets}>
        <div className={styles.demoHeader}>
          <Sparkles size={14} className={styles.sparkle} />
          <span>Select Demo Profile:</span>
        </div>
        <div className={styles.presetButtons}>
          <button
            type="button"
            className={`${styles.presetBtn} ${selectedRole === 'hr' ? styles.active : ''}`}
            onClick={() => setSelectedRole('hr')}
          >
            HR Admin
          </button>
          <button
            type="button"
            className={`${styles.presetBtn} ${selectedRole === 'manager' ? styles.active : ''}`}
            onClick={() => setSelectedRole('manager')}
          >
            Manager
          </button>
          <button
            type="button"
            className={`${styles.presetBtn} ${selectedRole === 'employee' ? styles.active : ''}`}
            onClick={() => setSelectedRole('employee')}
          >
            Employee
          </button>
        </div>
      </div>

      {formError && <div className={styles.errorAlert}>{formError}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <label htmlFor="email" className={styles.label}>
            Work Email Address
          </label>
          <div className={styles.inputWrapper}>
            <Mail size={16} className={styles.inputIcon} />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@staffsync.io"
              className={styles.input}
              required
            />
          </div>
        </div>

        <div className={styles.inputGroup}>
          <div className={styles.labelRow}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <span className={styles.forgotLink}>Use the local DEMO_PASSWORD from backend/.env</span>
          </div>
          <div className={styles.inputWrapper}>
            <Lock size={16} className={styles.inputIcon} />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className={styles.input}
              required
            />
            <button
              type="button"
              className={styles.passwordToggle}
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
          {isSubmitting ? 'Authenticating...' : `Enter as ${selectedRole.toUpperCase()} Portal`}
          {!isSubmitting && <ArrowRight size={16} />}
        </button>
      </form>

      <div className={styles.cardFooter}>
        <p>
          Need a new department account?{' '}
          <Link href="/register" className={styles.link}>
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className={styles.authContainer}>
      <div className={styles.authBackdrop}>
        <div className={styles.glowCircle} />
      </div>
      <Suspense fallback={<div className={styles.authCard}>Loading portal...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
