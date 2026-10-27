import test from 'node:test';
import assert from 'node:assert/strict';
import { authApi } from '../services/auth-api';
import { employeesApi } from '../services/employees-api';
import { attendanceApi } from '../services/attendance-api';
import { leavesApi } from '../services/leaves-api';
import { announcementsApi } from '../services/announcements-api';
import { trainingsApi } from '../services/trainings-api';
import { reportsApi } from '../services/reports-api';

test('1. Authentication Service — Role Resolution & Token Generation', async () => {
  const hrLogin = await authApi.login({ email: 'eleanor.vance@staffsync.io', roleHint: 'hr' });
  assert.equal(hrLogin.user.role, 'hr');
  assert.ok(hrLogin.token);

  const mgrLogin = await authApi.login({ email: 'marcus.sterling@staffsync.io', roleHint: 'manager' });
  assert.equal(mgrLogin.user.role, 'manager');

  const empLogin = await authApi.login({ email: 'aria.chen@staffsync.io', roleHint: 'employee' });
  assert.equal(empLogin.user.role, 'employee');
});

test('2. Employee Directory — Search and Filtering Boundaries', async () => {
  const allResult = await employeesApi.getAll();
  assert.ok(allResult.employees.length > 0);

  // Search by keyword
  const searchResult = await employeesApi.getAll({ search: 'Aria' });
  assert.ok(searchResult.employees.some((e) => e.name.includes('Aria')));

  // Filter by department
  const deptResult = await employeesApi.getAll({ department: 'Engineering' });
  assert.ok(deptResult.employees.every((e) => e.department === 'Engineering'));

  // Create new employee
  const created = await employeesApi.create({
    name: 'Test Candidate',
    email: 'test.candidate@staffsync.io',
    password: 'TestOnly-Password-123!',
    role: 'employee',
    department: 'Engineering',
    designation: 'QA Automation Engineer',
    status: 'active',
    phone: '+1 (555) 999-8888',
    joiningDate: '2026-10-27',
    salary: 85000,
  });
  assert.ok(created.id);
  assert.equal(created.name, 'Test Candidate');

  // Edit employee status
  const updated = await employeesApi.update(created.id, { status: 'on_leave' });
  assert.equal(updated.status, 'on_leave');
});

test('3. Attendance State Transitions — Clock In and Clock Out Tracking', async () => {
  const inRecord = await attendanceApi.clockIn();
  assert.ok(inRecord.clockIn);
  assert.equal(inRecord.status, 'present');

  const outRecord = await attendanceApi.clockOut();
  assert.ok(outRecord.clockOut);
  assert.ok((outRecord.workingHours ?? 0) > 0);
});

test('4. Leave Workflow — Application, Duration Calculation, and Decision State', async () => {
  const newLeave = await leavesApi.apply({
    leaveType: 'annual',
    startDate: '2026-12-01',
    endDate: '2026-12-03',
    reason: 'Year-end personal recharge and family gathering.',
  });

  assert.equal(newLeave.status, 'pending');
  assert.equal(newLeave.daysCount, 3);

  // Approver decision
  const approvedLeave = await leavesApi.decide(newLeave.id, {
    status: 'approved',
    reviewerComment: 'Approved by management. Please ensure coverage is set.',
  });

  assert.equal(approvedLeave.status, 'approved');
  assert.ok(approvedLeave.reviewedAt);
});

test('5. Announcements Engine — Broadcast Creation & Audience Targeting', async () => {
  const allAnnouncements = await announcementsApi.getAll();
  assert.ok(allAnnouncements.announcements.length > 0);
  assert.equal(allAnnouncements.page, 1);

  const newNotice = await announcementsApi.create({
    title: 'Automated Test Executive Broadcast',
    content: 'Testing notice distribution systems.',
    targetAudience: 'all',
    priority: 'urgent',
    authorName: 'System Test Suite',
  });

  assert.ok(newNotice.id);
  assert.equal(newNotice.priority, 'urgent');
});

test('6. Training & Continuous Learning — Capacity & Enrollment', async () => {
  const programs = await trainingsApi.getAll();
  assert.ok(programs.trainings.length > 0);

  const target = programs.trainings[0];
  const initialCount = target.enrolledCount;
  const enrolled = await trainingsApi.enroll(target.id);
  assert.equal(enrolled.isEnrolled, true);
  assert.equal(enrolled.enrolledCount, initialCount + 1);
});

test('7. Reports & Analytics — Metric Integrity & Non-Null Envelopes', async () => {
  const attReport = await reportsApi.getAttendanceReport();
  assert.ok(attReport.summary.avgAttendanceRate === null || (attReport.summary.avgAttendanceRate >= 0 && attReport.summary.avgAttendanceRate <= 100));
  assert.ok(attReport.summary.totalAbsences >= 0);

  const leaveReport = await reportsApi.getLeaveReport();
  assert.ok(leaveReport.summary.totalApplications > 0);
  assert.ok(leaveReport.typeDistribution.length > 0);
});
