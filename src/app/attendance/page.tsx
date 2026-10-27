'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/provider';
import { addToast } from '@/store/slices/uiSlice';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { PaginationControls } from '@/components/ui/PaginationControls';
import { attendanceApi } from '@/services/attendance-api';
import { AttendanceRecord } from '@/types';
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Timer,
  Play,
  Square,
  Filter,
} from 'lucide-react';
import styles from './attendance.module.scss';

export default function AttendancePage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const role = user?.role || 'employee';

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 0 });
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [filterDate, setFilterDate] = useState('');

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const today = await attendanceApi.getToday();
      setTodayRecord(today);
      const list = await attendanceApi.getAll({ ...(filterDate ? { date: filterDate } : {}), page, limit: 25 });
      setRecords(list.records);
      setPagination(list);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [filterDate, page]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const handleClockIn = async () => {
    setActionLoading(true);
    try {
      const res = await attendanceApi.clockIn();
      setTodayRecord(res);
      dispatch(addToast({ type: 'success', message: 'Clocked in at ' + res.clockIn }));
      fetchAttendance();
    } catch (err: unknown) {
      dispatch(
        addToast({
          type: 'error',
          message: err instanceof Error ? err.message : 'Failed to clock in.',
        })
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    setActionLoading(true);
    try {
      const res = await attendanceApi.clockOut();
      setTodayRecord(res);
      dispatch(addToast({ type: 'success', message: 'Clocked out at ' + res.clockOut }));
      fetchAttendance();
    } catch (err: unknown) {
      dispatch(
        addToast({
          type: 'error',
          message: err instanceof Error ? err.message : 'Failed to clock out.',
        })
      );
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AuthGuard>
      <AppLayout>
        <div className={styles.container}>
          {/* Header */}
          <div className={styles.pageHeader}>
            <div>
              <h2 className={styles.pageTitle}>Attendance Management</h2>
              <p className={styles.pageSubtitle}>
                {role === 'hr'
                  ? 'Organization-wide daily attendance logs and compliance review.'
                  : role === 'manager'
                  ? 'Team attendance logs and shift verification.'
                  : 'Log your working hours and view attendance history.'}
              </p>
            </div>
          </div>

          {/* Today's Shift Card */}
          <div className={styles.todayCard}>
            <div className={styles.todayMain}>
              <div className={styles.todayHeader}>
                <span className={styles.todayBadge}>
                  <Timer size={14} /> Today&apos;s Timecard
                </span>
                <span className={styles.currentDate}>
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>

              <div className={styles.shiftMetrics}>
                <div className={styles.shiftCol}>
                  <span className={styles.metricLabel}>Clock In</span>
                  <span className={styles.metricValue}>
                    {todayRecord?.clockIn ? todayRecord.clockIn : '--:--'}
                  </span>
                </div>
                <div className={styles.shiftDivider} />
                <div className={styles.shiftCol}>
                  <span className={styles.metricLabel}>Clock Out</span>
                  <span className={styles.metricValue}>
                    {todayRecord?.clockOut ? todayRecord.clockOut : '--:--'}
                  </span>
                </div>
                <div className={styles.shiftDivider} />
                <div className={styles.shiftCol}>
                  <span className={styles.metricLabel}>Status</span>
                  <span className={styles.metricStatus}>
                    {todayRecord?.status ? (
                      <span className="badge badge-success">
                        {todayRecord.status.toUpperCase()}
                      </span>
                    ) : (
                      <span className="badge badge-neutral">PENDING CLOCK-IN</span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.actionSection}>
              {!todayRecord || !todayRecord.clockIn ? (
                <button
                  className={`${styles.clockActionBtn} ${styles.clockIn}`}
                  onClick={handleClockIn}
                  disabled={actionLoading}
                >
                  <Play size={16} />
                  {actionLoading ? 'Recording...' : 'Clock In Now'}
                </button>
              ) : !todayRecord.clockOut ? (
                <button
                  className={`${styles.clockActionBtn} ${styles.clockOut}`}
                  onClick={handleClockOut}
                  disabled={actionLoading}
                >
                  <Square size={16} />
                  {actionLoading ? 'Recording...' : 'Clock Out (End Shift)'}
                </button>
              ) : (
                <div className={styles.shiftDoneBanner}>
                  <CheckCircle2 size={18} className={styles.doneIcon} />
                  <span>Shift Completed Today</span>
                </div>
              )}
            </div>
          </div>

          {/* Filter Bar */}
          <div className={styles.filterBar}>
            <div className={styles.datePickerWrapper}>
              <Calendar size={15} className={styles.filterIcon} />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => { setFilterDate(e.target.value); setPage(1); }}
                className={styles.dateInput}
              />
              {filterDate && (
                <button
                  className={styles.clearBtn}
                  onClick={() => { setFilterDate(''); setPage(1); }}
                >
                  Clear Filter
                </button>
              )}
            </div>

            <span className={styles.totalRecords}>
              Showing <strong>{records.length}</strong> of {pagination.total} record(s)
            </span>
          </div>
          <PaginationControls page={pagination.page} pages={pagination.pages} total={pagination.total} onPageChange={setPage} />

          {/* Records Table */}
          <div className={styles.tableCard}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Duration</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className={styles.emptyState}>
                      Loading attendance records...
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={styles.emptyState}>
                      No attendance records found for this period.
                    </td>
                  </tr>
                ) : (
                  records.map((rec) => (
                    <tr key={rec.id} className={styles.tableRow}>
                      <td>
                        <div className={styles.empInfo}>
                          <span className={styles.empName}>
                            {rec.employeeName || user?.name}
                          </span>
                          <span className={styles.empDept}>{rec.department || user?.department}</span>
                        </div>
                      </td>
                      <td>
                        <span className={styles.tableDate}>{rec.date}</span>
                      </td>
                      <td>
                        <span className={styles.timeTag}>{rec.clockIn}</span>
                      </td>
                      <td>
                        <span className={styles.timeTag}>{rec.clockOut || '--'}</span>
                      </td>
                      <td>
                        <span className={styles.durationTag}>
                          {rec.workingHours ? `${rec.workingHours} hrs` : '--'}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            rec.status === 'present'
                              ? 'badge-success'
                              : rec.status === 'late'
                              ? 'badge-warning'
                              : 'badge-danger'
                          }`}
                        >
                          {rec.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
