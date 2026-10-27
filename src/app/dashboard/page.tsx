'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAppSelector, useAppDispatch } from '@/store/provider';
import { addToast } from '@/store/slices/uiSlice';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { dashboardApi } from '@/services/dashboard-api';
import { attendanceApi } from '@/services/attendance-api';
import { leavesApi } from '@/services/leaves-api';
import { reportsApi, PerformanceIndicator } from '@/services/reports-api';
import {
  HRDashboardMetrics,
  ManagerDashboardMetrics,
  EmployeeDashboardMetrics,
  AttendanceRecord,
} from '@/types';
import {
  Users,
  Clock,
  CalendarDays,
  GraduationCap,
  BellRing,
  ArrowRight,
  CheckCircle2,
  XCircle,
  TrendingUp,
  UserPlus,
  FileBarChart,
  Megaphone,
} from 'lucide-react';
import styles from './dashboard.module.scss';

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const role = user?.role || 'employee';

  const [hrData, setHrData] = useState<HRDashboardMetrics | null>(null);
  const [managerData, setManagerData] = useState<ManagerDashboardMetrics | null>(null);
  const [managerPerformance, setManagerPerformance] = useState<PerformanceIndicator[]>([]);
  const [employeeData, setEmployeeData] = useState<EmployeeDashboardMetrics | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [clockActionLoading, setClockActionLoading] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        if (role === 'hr') {
          const res = await dashboardApi.getHRDashboard();
          setHrData(res);
        } else if (role === 'manager') {
          const [res, performance] = await Promise.all([
            dashboardApi.getManagerDashboard(),
            reportsApi.getPerformanceReport({ limit: 100 }),
          ]);
          setManagerData(res);
          setManagerPerformance(performance.indicators);
        } else {
          const res = await dashboardApi.getEmployeeDashboard();
          setEmployeeData(res);
        }
        // Always fetch today's attendance for clock widget
        const att = await attendanceApi.getToday();
        setTodayAttendance(att);
      } catch {
        // Handled gracefully
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [role]);

  const handleClockToggle = async () => {
    setClockActionLoading(true);
    try {
      if (!todayAttendance || !todayAttendance.clockIn) {
        const res = await attendanceApi.clockIn();
        setTodayAttendance(res);
        dispatch(addToast({ type: 'success', message: 'Clocked in successfully!' }));
      } else if (!todayAttendance.clockOut) {
        const res = await attendanceApi.clockOut();
        setTodayAttendance(res);
        dispatch(addToast({ type: 'success', message: 'Clocked out successfully!' }));
      }
    } catch (err: unknown) {
      dispatch(
        addToast({
          type: 'error',
          message: err instanceof Error ? err.message : 'Attendance action failed',
        })
      );
    } finally {
      setClockActionLoading(false);
    }
  };

  const handleLeaveDecision = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await leavesApi.decide(id, { status, reviewerComment: `Marked ${status} via dashboard review` });
      dispatch(addToast({ type: 'success', message: `Leave application ${status}.` }));
      // refresh manager dashboard
      const res = await dashboardApi.getManagerDashboard();
      setManagerData(res);
    } catch {
      dispatch(addToast({ type: 'error', message: 'Action could not be saved.' }));
    }
  };

  return (
    <AuthGuard>
      <AppLayout>
        <div className={styles.dashboardContainer}>
          {/* Welcome Banner */}
          <div className={styles.welcomeBanner}>
            <div className={styles.welcomeInfo}>
              <span className={styles.dateLabel}>
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              <h2 className={styles.greeting}>
                Good day, {user?.name || 'Colleague'}
              </h2>
              <p className={styles.subGreeting}>
                Here is your {user?.role.toUpperCase()} operational briefing and workforce activity.
              </p>
            </div>

            {/* Quick Clock-in Pill widget */}
            <div className={styles.attendancePillWidget}>
              <div className={styles.clockMeta}>
                <span className={styles.clockLabel}>Today&apos;s Shift</span>
                <span className={styles.clockStatus}>
                  {todayAttendance?.clockOut
                    ? `Clocked out (${todayAttendance.clockOut})`
                    : todayAttendance?.clockIn
                    ? `Clocked in (${todayAttendance.clockIn})`
                    : 'Not Clocked In'}
                </span>
              </div>
              <button
                className={`${styles.clockBtn} ${
                  todayAttendance?.clockOut
                    ? styles.disabled
                    : todayAttendance?.clockIn
                    ? styles.clockOut
                    : styles.clockIn
                }`}
                onClick={handleClockToggle}
                disabled={clockActionLoading || !!todayAttendance?.clockOut}
              >
                <Clock size={16} />
                {clockActionLoading
                  ? 'Processing...'
                  : todayAttendance?.clockOut
                  ? 'Shift Completed'
                  : todayAttendance?.clockIn
                  ? 'Clock Out'
                  : 'Clock In'}
              </button>
            </div>
          </div>

          {/* HR DASHBOARD VIEW */}
          {role === 'hr' && hrData && (
            <div className={styles.roleDashboard}>
              {/* Top Metrics Row */}
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statHeader}>
                    <span className={styles.statTitle}>Total Headcount</span>
                    <Users size={18} className={styles.statIcon} />
                  </div>
                  <div className={styles.statValue}>{hrData.totalEmployees}</div>
                  <div className={styles.statFooter}>
                    <span className={styles.highlight}>{hrData.activeEmployees} active</span>
                    <span>• {hrData.onLeaveCount} on leave</span>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statHeader}>
                    <span className={styles.statTitle}>Attendance Rate</span>
                    <TrendingUp size={18} className={styles.statIcon} />
                  </div>
                  <div className={styles.statValue}>{hrData.attendanceRate === null ? '—' : `${hrData.attendanceRate}%`}</div>
                  <div className={styles.statFooter}>
                    <span className="badge badge-neutral">Present or late among saved records</span>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statHeader}>
                    <span className={styles.statTitle}>Pending Leaves</span>
                    <CalendarDays size={18} className={styles.statIcon} />
                  </div>
                  <div className={styles.statValue}>{hrData.pendingLeavesCount}</div>
                  <div className={styles.statFooter}>
                    <Link href="/leaves" className={styles.statLink}>
                      Review leaves <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statHeader}>
                    <span className={styles.statTitle}>Active Trainings</span>
                    <GraduationCap size={18} className={styles.statIcon} />
                  </div>
                  <div className={styles.statValue}>{hrData.activeTrainingsCount}</div>
                  <div className={styles.statFooter}>
                    <Link href="/trainings" className={styles.statLink}>
                      View catalog <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              </div>

              {/* HR Quick Actions & Department Breakdown */}
              <div className={styles.twoColumnGrid}>
                <div className={styles.panelCard}>
                  <div className={styles.panelHeader}>
                    <h3 className={styles.panelTitle}>Department Workforce Allocation</h3>
                  </div>
                  <div className={styles.departmentList}>
                    {hrData.departmentBreakdown.map((dept) => (
                      <div key={dept.department} className={styles.deptItem}>
                        <div className={styles.deptInfo}>
                          <span className={styles.deptName}>{dept.department}</span>
                          <span className={styles.deptCount}>{dept.count} members</span>
                        </div>
                        <div className={styles.progressBar}>
                          <div
                            className={styles.progressFill}
                            style={{
                              width: `${(dept.count / hrData.totalEmployees) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className={styles.panelHeader}>
                    <h3 className={styles.panelTitle}>Last 7 days · recorded attendance only</h3>
                  </div>
                  <p className={styles.performanceNote}>Rate is present or late entries divided by saved entries. Days with no records are shown as no data, not as absences.</p>
                  <div className={styles.departmentList}>
                    {hrData.weeklyAttendance.map((item) => (
                      <div key={item.date} className={styles.deptItem}>
                        <div className={styles.deptInfo}>
                          <span className={styles.deptName}>{item.day} · {item.date}</span>
                          <span className={styles.deptCount}>{item.rate === null ? 'No records' : `${item.rate}% · ${item.recordedCount} records`}</span>
                        </div>
                        {item.rate !== null && (
                          <div className={styles.progressBar}>
                            <div className={styles.progressFill} style={{ width: `${item.rate}%` }} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.panelCard}>
                  <div className={styles.panelHeader}>
                    <h3 className={styles.panelTitle}>Administrative Quick Actions</h3>
                  </div>
                  <div className={styles.actionGrid}>
                    <Link href="/employees" className={styles.actionTile}>
                      <UserPlus size={20} className={styles.actionIcon} />
                      <span className={styles.actionLabel}>Add New Employee</span>
                    </Link>
                    <Link href="/announcements" className={styles.actionTile}>
                      <Megaphone size={20} className={styles.actionIcon} />
                      <span className={styles.actionLabel}>Broadcast Notice</span>
                    </Link>
                    <Link href="/reports" className={styles.actionTile}>
                      <FileBarChart size={20} className={styles.actionIcon} />
                      <span className={styles.actionLabel}>Generate Reports</span>
                    </Link>
                    <Link href="/trainings" className={styles.actionTile}>
                      <GraduationCap size={20} className={styles.actionIcon} />
                      <span className={styles.actionLabel}>Schedule Workshop</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MANAGER DASHBOARD VIEW */}
          {role === 'manager' && managerData && (
            <div className={styles.roleDashboard}>
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statHeader}>
                    <span className={styles.statTitle}>Assigned Team</span>
                    <Users size={18} className={styles.statIcon} />
                  </div>
                  <div className={styles.statValue}>{managerData.teamSize}</div>
                  <div className={styles.statFooter}>Direct reporting team</div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statHeader}>
                    <span className={styles.statTitle}>Present Today</span>
                    <Clock size={18} className={styles.statIcon} />
                  </div>
                  <div className={styles.statValue}>{managerData.teamPresentToday}</div>
                  <div className={styles.statFooter}>
                    <span className={styles.highlight}>
                      {managerData.teamOnLeaveToday} member(s) on approved leave
                    </span>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statHeader}>
                    <span className={styles.statTitle}>Pending Reviews</span>
                    <CalendarDays size={18} className={styles.statIcon} />
                  </div>
                  <div className={styles.statValue}>{managerData.pendingLeavesCount}</div>
                  <div className={styles.statFooter}>
                    <Link href="/leaves" className={styles.statLink}>
                      Open leave queue <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Team Members Roster */}
              <div className={styles.panelCard}>
                <div className={styles.panelHeader}>
                  <h3 className={styles.panelTitle}>Team Roster & Status</h3>
                  <Link href="/employees" className="pill-btn-secondary">
                    View Full Directory
                  </Link>
                </div>
                <div className={styles.rosterGrid}>
                  {managerData.teamMembers.map((member) => (
                    <div key={member.id} className={styles.rosterCard}>
                      <div className={styles.avatarCircle}>
                        {member.name.charAt(0)}
                      </div>
                      <div className={styles.memberMeta}>
                        <h4 className={styles.memberName}>{member.name}</h4>
                        <span className={styles.memberDesignation}>{member.designation}</span>
                        <span className={styles.memberEmail}>{member.email}</span>
                      </div>
                      <span
                        className={`badge ${
                          member.status === 'active'
                            ? 'badge-success'
                            : member.status === 'on_leave'
                            ? 'badge-warning'
                            : 'badge-neutral'
                        }`}
                      >
                        {member.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles.panelCard}>
                <div className={styles.panelHeader}>
                  <h3 className={styles.panelTitle}>Recorded Team Activity</h3>
                  <Link href="/reports" className={styles.panelLink}>Full reports</Link>
                </div>
                <p className={styles.performanceNote}>
                  Attendance and training records are activity indicators, not a measure of productivity or overall performance. Period: last 30 days.
                </p>
                <div className={styles.performanceGrid}>
                  {managerPerformance.length === 0 ? (
                    <p className={styles.performanceNote}>No active team members or recorded activity in this period.</p>
                  ) : managerPerformance.map((member) => (
                    <div key={member.employeeId} className={styles.performanceCard}>
                      <strong>{member.name}</strong>
                      <span>{member.designation} · {member.department}</span>
                      <span>Attendance records: {member.attendance.recordedDays} ({member.attendance.attendanceRate === null ? 'no data' : `${member.attendance.attendanceRate}% present or late`})</span>
                      <span>Present: {member.attendance.presentDays} · Late: {member.attendance.lateDays} · Explicit absences: {member.attendance.explicitAbsenceDays}</span>
                      <span>Training: {member.training.completed} completed / {member.training.enrollments} enrolled</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* EMPLOYEE DASHBOARD VIEW */}
          {role === 'employee' && employeeData && (
            <div className={styles.roleDashboard}>
              {/* Leave Balances Strip */}
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statHeader}>
                    <span className={styles.statTitle}>Available Leave</span>
                    <CalendarDays size={18} className={styles.statIcon} />
                  </div>
                  <div className={styles.statValue}>
                    {employeeData.leaveBalance.remaining}{' '}
                    <span className={styles.statUnit}>Days</span>
                  </div>
                  <div className={styles.statFooter}>
                    Out of {employeeData.leaveBalance.total} annual allowance
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statHeader}>
                    <span className={styles.statTitle}>Sick Leave Balance</span>
                    <CalendarDays size={18} className={styles.statIcon} />
                  </div>
                  <div className={styles.statValue}>
                    {employeeData.leaveBalance.sick}{' '}
                    <span className={styles.statUnit}>Days</span>
                  </div>
                  <div className={styles.statFooter}>Accrued medical balance</div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statHeader}>
                    <span className={styles.statTitle}>Casual Leave Balance</span>
                    <CalendarDays size={18} className={styles.statIcon} />
                  </div>
                  <div className={styles.statValue}>
                    {employeeData.leaveBalance.casual}{' '}
                    <span className={styles.statUnit}>Days</span>
                  </div>
                  <div className={styles.statFooter}>Personal time-off</div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statHeader}>
                    <span className={styles.statTitle}>Upcoming Workshops</span>
                    <GraduationCap size={18} className={styles.statIcon} />
                  </div>
                  <div className={styles.statValue}>
                    {employeeData.upcomingTrainingsCount}
                  </div>
                  <div className={styles.statFooter}>
                    <Link href="/trainings" className={styles.statLink}>
                      Browse courses <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Employee Shortcuts & Announcements */}
              <div className={styles.twoColumnGrid}>
                <div className={styles.panelCard}>
                  <div className={styles.panelHeader}>
                    <h3 className={styles.panelTitle}>Quick Services</h3>
                  </div>
                  <div className={styles.actionGrid}>
                    <Link href="/leaves" className={styles.actionTile}>
                      <CalendarDays size={20} className={styles.actionIcon} />
                      <span className={styles.actionLabel}>Apply for Leave</span>
                    </Link>
                    <Link href="/attendance" className={styles.actionTile}>
                      <Clock size={20} className={styles.actionIcon} />
                      <span className={styles.actionLabel}>Attendance Log</span>
                    </Link>
                    <Link href="/trainings" className={styles.actionTile}>
                      <GraduationCap size={20} className={styles.actionIcon} />
                      <span className={styles.actionLabel}>Skill Workshops</span>
                    </Link>
                    <Link href="/settings" className={styles.actionTile}>
                      <Users size={20} className={styles.actionIcon} />
                      <span className={styles.actionLabel}>My Profile</span>
                    </Link>
                  </div>
                </div>

                <div className={styles.panelCard}>
                  <div className={styles.panelHeader}>
                    <h3 className={styles.panelTitle}>Company Announcements</h3>
                    <Link href="/announcements" className={styles.panelLink}>
                      All notices
                    </Link>
                  </div>
                  <div className={styles.announcementStream}>
                    {employeeData.recentAnnouncements.map((ann) => (
                      <div key={ann.id} className={styles.annItem}>
                        <div className={styles.annHeader}>
                          <h4 className={styles.annTitle}>{ann.title}</h4>
                          <span
                            className={`badge ${
                              ann.priority === 'urgent' ? 'badge-danger' : 'badge-neutral'
                            }`}
                          >
                            {ann.priority.toUpperCase()}
                          </span>
                        </div>
                        <p className={styles.annSnippet}>{ann.content}</p>
                        <span className={styles.annMeta}>
                          Posted by {ann.authorName} • {ann.createdAt}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
