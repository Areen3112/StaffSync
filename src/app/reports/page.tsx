'use client';

import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/provider';
import { addToast } from '@/store/slices/uiSlice';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { PaginationControls } from '@/components/ui/PaginationControls';
import { reportsApi, AttendanceReportData, LeaveReportData, PerformanceReportData } from '@/services/reports-api';
import {
  BarChart3,
  Calendar,
  Download,
  TrendingUp,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  PieChart,
} from 'lucide-react';
import styles from './reports.module.scss';

export default function ReportsPage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState<'attendance' | 'leaves' | 'performance'>('attendance');
  const [attReport, setAttReport] = useState<AttendanceReportData | null>(null);
  const [leaveReport, setLeaveReport] = useState<LeaveReportData | null>(null);
  const [performanceReport, setPerformanceReport] = useState<PerformanceReportData | null>(null);
  const [performancePage, setPerformancePage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchSummaryReports = async () => {
      try {
        const [att, lv] = await Promise.all([
          reportsApi.getAttendanceReport(),
          reportsApi.getLeaveReport(),
        ]);
        if (active) {
          setAttReport(att);
          setLeaveReport(lv);
        }
      } catch {
        if (active) dispatch(addToast({ type: 'error', message: 'Attendance and leave reports could not be loaded.' }));
      } finally {
        if (active) setSummaryLoading(false);
      }
    };

    void fetchSummaryReports();
    return () => { active = false; };
  }, [dispatch]);

  useEffect(() => {
    let active = true;
    const fetchPerformanceReport = async () => {
      setLoading(true);
      try {
        const performance = await reportsApi.getPerformanceReport({ page: performancePage, limit: 25 });
        if (active) setPerformanceReport(performance);
      } catch {
        if (active) dispatch(addToast({ type: 'error', message: 'Recorded activity report could not be loaded.' }));
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchPerformanceReport();
    return () => { active = false; };
  }, [dispatch, performancePage]);

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,Category,Metric,Value\n' +
      `Attendance,Avg Rate,${attReport?.summary.avgAttendanceRate}%\n` +
      `Attendance,Total Work Days,${attReport?.summary.totalWorkDays}\n` +
      `Attendance,Total Absences,${attReport?.summary.totalAbsences}\n` +
      `Leaves,Total Applications,${leaveReport?.summary.totalApplications}\n` +
      `Leaves,Approved,${leaveReport?.summary.approved}\n` +
      `Leaves,Rejected,${leaveReport?.summary.rejected}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `staffsync-report-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AuthGuard allowedRoles={['hr', 'manager']}>
      <AppLayout>
        <div className={styles.container}>
          {/* Header */}
          <div className={styles.pageHeader}>
            <div>
              <h2 className={styles.pageTitle}>Workforce Analytics & Reports</h2>
              <p className={styles.pageSubtitle}>
                Executive reporting for enterprise attendance trends and leave distributions.
              </p>
            </div>

            <button className="pill-btn-secondary" onClick={handleExportCSV}>
              <Download size={15} /> Export Audit Dataset (CSV)
            </button>
          </div>

          {/* Report Type Selector */}
          <div className={styles.reportTabs}>
            <button
              className={`${styles.tab} ${activeTab === 'attendance' ? styles.active : ''}`}
              onClick={() => setActiveTab('attendance')}
            >
              <Clock size={16} /> Attendance & Punctuality Report
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'leaves' ? styles.active : ''}`}
              onClick={() => setActiveTab('leaves')}
            >
              <PieChart size={16} /> Leave Utilization & Quota Report
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'performance' ? styles.active : ''}`}
              onClick={() => setActiveTab('performance')}
            >
              <Users size={16} /> Recorded Activity Indicators
            </button>
          </div>

          {loading || summaryLoading ? (
            <div className={styles.loadingBox}>Synthesizing workforce analytics...</div>
          ) : activeTab === 'attendance' && attReport ? (
            <div className={styles.reportContent}>
              {/* Summary Metrics */}
              <div className={styles.metricsGrid}>
                <div className={styles.metricCard}>
                  <span className={styles.mLabel}>Average Attendance Rate</span>
                  <span className={styles.mValue}>{attReport.summary.avgAttendanceRate === null ? '—' : `${attReport.summary.avgAttendanceRate}%`}</span>
                  <span className={styles.mSub}>Present or late / recorded entries</span>
                </div>
                <div className={styles.metricCard}>
                  <span className={styles.mLabel}>Recorded Attendance Dates</span>
                  <span className={styles.mValue}>{attReport.summary.totalWorkDays}</span>
                  <span className={styles.mSub}>Dates with at least one saved record</span>
                </div>
                <div className={styles.metricCard}>
                  <span className={styles.mLabel}>Total Absences</span>
                  <span className={styles.mValue}>{attReport.summary.totalAbsences}</span>
                  <span className={styles.mSub}>Explicit absent records only</span>
                </div>
                <div className={styles.metricCard}>
                  <span className={styles.mLabel}>Late Clock-ins</span>
                  <span className={styles.mValue}>{attReport.summary.totalLateArrivals}</span>
                  <span className={styles.mSub}>Logged past grace period</span>
                </div>
              </div>

              {/* Attendance Charts */}
              <div className={styles.chartsGrid}>
                <div className={styles.chartCard}>
                  <div className={styles.chartHeader}>
                    <h3 className={styles.chartTitle}>Monthly Attendance Rate Trend (%)</h3>
                  </div>
                  <div className={styles.barVisualContainer}>
                    {attReport.monthlyTrends.map((trend) => (
                      <div key={trend.month} className={styles.barCol}>
                        <div className={styles.barTrack}>
                          <div
                            className={styles.barFill}
                            style={{ height: `${trend.rate ?? 0}%` }}
                          >
                            <span className={styles.barTooltip}>{trend.rate}%</span>
                          </div>
                        </div>
                        <span className={styles.barLabel}>{trend.month}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.chartCard}>
                  <div className={styles.chartHeader}>
                    <h3 className={styles.chartTitle}>Department Attendance Compliance</h3>
                  </div>
                  <div className={styles.deptProgressList}>
                    {attReport.departmentBreakdown.map((dept) => (
                      <div key={dept.department} className={styles.deptRow}>
                        <div className={styles.deptRowMeta}>
                          <span className={styles.deptRowName}>{dept.department}</span>
                          <span className={styles.deptRowRate}>{dept.rate === null ? '—' : `${dept.rate}%`}</span>
                        </div>
                        <div className={styles.deptTrack}>
                          <div
                            className={styles.deptFill}
                            style={{ width: `${dept.rate ?? 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'leaves' && leaveReport ? (
            <div className={styles.reportContent}>
              {/* Summary Metrics */}
              <div className={styles.metricsGrid}>
                <div className={styles.metricCard}>
                  <span className={styles.mLabel}>Total Leave Applications</span>
                  <span className={styles.mValue}>{leaveReport.summary.totalApplications}</span>
                  <span className={styles.mSub}>Annual cycle aggregate</span>
                </div>
                <div className={styles.metricCard}>
                  <span className={styles.mLabel}>Approved Leaves</span>
                  <span className={styles.mValue}>{leaveReport.summary.approved}</span>
                  <span className="badge badge-success">81.2% Approval Rate</span>
                </div>
                <div className={styles.metricCard}>
                  <span className={styles.mLabel}>Rejected Applications</span>
                  <span className={styles.mValue}>{leaveReport.summary.rejected}</span>
                  <span className="badge badge-danger">Policy Constraints</span>
                </div>
                <div className={styles.metricCard}>
                  <span className={styles.mLabel}>Pending Under Review</span>
                  <span className={styles.mValue}>{leaveReport.summary.pending}</span>
                  <span className="badge badge-warning">Awaiting Decision</span>
                </div>
              </div>

              {/* Leave Breakdown Visuals */}
              <div className={styles.chartsGrid}>
                <div className={styles.chartCard}>
                  <div className={styles.chartHeader}>
                    <h3 className={styles.chartTitle}>Leave Category Distribution</h3>
                  </div>
                  <div className={styles.categoryDistribution}>
                    {leaveReport.typeDistribution.map((t) => (
                      <div key={t.type} className={styles.catItem}>
                        <div className={styles.catMeta}>
                          <span className={styles.catName}>{t.type}</span>
                          <strong>{t.count} Requests</strong>
                        </div>
                        <div className={styles.deptTrack}>
                          <div
                            className={styles.deptFillAlt}
                            style={{
                              width: `${(t.count / leaveReport.summary.totalApplications) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.chartCard}>
                  <div className={styles.chartHeader}>
                    <h3 className={styles.chartTitle}>Absence Days by Month</h3>
                  </div>
                  <div className={styles.barVisualContainer}>
                    {leaveReport.monthlyDistribution.map((m) => (
                      <div key={m.month} className={styles.barCol}>
                        <div className={styles.barTrack}>
                          <div
                            className={styles.barFillAlt}
                            style={{ height: `${(m.days / 30) * 100}%` }}
                          >
                            <span className={styles.barTooltip}>{m.days}d</span>
                          </div>
                        </div>
                        <span className={styles.barLabel}>{m.month}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'performance' && performanceReport ? (
            <div className={styles.reportContent}>
              <div className={styles.chartCard}>
                <div className={styles.chartHeader}>
                  <h3 className={styles.chartTitle}>Recorded activity by active employee</h3>
                </div>
                <p className={styles.performanceNote}>
                  {performanceReport.note} Period: {performanceReport.period.startDate} to {performanceReport.period.endDate}. No score is calculated. Missing attendance records are not treated as absences.
                </p>
                {performanceReport.indicators.length === 0 ? (
                  <p className={styles.performanceNote}>No active employees or recorded activity for this scope.</p>
                ) : (
                  <div className={styles.performanceGrid}>
                    {performanceReport.indicators.map((item) => (
                      <div key={item.employeeId} className={styles.performanceCard}>
                        <strong>{item.name}</strong>
                        <span>{item.designation} · {item.department}</span>
                        <span>Attendance: {item.attendance.recordedDays} records · {item.attendance.presentDays} present · {item.attendance.lateDays} late · {item.attendance.explicitAbsenceDays} explicitly absent</span>
                        <span>Attendance rate: {item.attendance.attendanceRate === null ? 'No records' : `${item.attendance.attendanceRate}% present or late among recorded entries`}</span>
                        <span>Training: {item.training.completed} completed / {item.training.enrollments} enrolled</span>
                      </div>
                    ))}
                  </div>
                )}
                <PaginationControls page={performanceReport.page} pages={performanceReport.pages} total={performanceReport.total} onPageChange={setPerformancePage} />
              </div>
            </div>
          ) : null}
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
