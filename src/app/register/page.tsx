'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/store/provider';
import { setCredentials } from '@/store/slices/authSlice';
import { addToast } from '@/store/slices/uiSlice';
import { authApi } from '@/services/auth-api';
import { UserRole } from '@/types';
import { ShieldCheck, ArrowRight, User, Mail, Lock, Building, Briefcase } from 'lucide-react';
import styles from './register.module.scss';

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('employee');
  const [department, setDepartment] = useState('Engineering');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name || !email || !password) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await authApi.register({
        name,
        email,
        password,
        role,
        department,
      });

      dispatch(setCredentials(data));
      dispatch(
        addToast({
          type: 'success',
          message: `Account created for ${data.user.name}. Welcome to StaffSync!`,
        })
      );
      router.push('/dashboard');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authBackdrop}>
        <div className={styles.glowCircle} />
      </div>

      <div className={styles.authCard}>
        <div className={styles.cardHeader}>
          <Link href="/" className={styles.brandBadge}>
            <div className={styles.brandIcon}>
              <ShieldCheck size={20} />
            </div>
            <span className={styles.brandName}>StaffSync</span>
          </Link>
          <h1 className={styles.headline}>Register Account</h1>
          <p className={styles.subline}>Create a role-assigned profile on the platform</p>
        </div>

        {errorMsg && <div className={styles.errorAlert}>{errorMsg}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Full Name</label>
            <div className={styles.inputWrapper}>
              <User size={16} className={styles.inputIcon} />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jordan Miller"
                className={styles.input}
                required
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Work Email Address</label>
            <div className={styles.inputWrapper}>
              <Mail size={16} className={styles.inputIcon} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jordan.miller@staffsync.io"
                className={styles.input}
                required
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Initial Role</label>
              <div className={styles.inputWrapper}>
                <Briefcase size={16} className={styles.inputIcon} />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className={styles.select}
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="hr">HR Admin</option>
                </select>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Department</label>
              <div className={styles.inputWrapper}>
                <Building size={16} className={styles.inputIcon} />
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className={styles.select}
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Product & Design">Product & Design</option>
                  <option value="People Operations">People Operations</option>
                  <option value="Finance & Legal">Finance & Legal</option>
                </select>
              </div>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Password</label>
            <div className={styles.inputWrapper}>
              <Lock size={16} className={styles.inputIcon} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className={styles.input}
                required
              />
            </div>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
            {isSubmitting ? 'Registering...' : 'Complete Registration'}
            {!isSubmitting && <ArrowRight size={16} />}
          </button>
        </form>

        <div className={styles.cardFooter}>
          <p>
            Already have an active account?{' '}
            <Link href="/login" className={styles.link}>
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
