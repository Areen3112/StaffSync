import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import request from 'supertest';

const runId = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = `mongodb://127.0.0.1:27017/staffsync_test_${runId}`;
process.env.JWT_SECRET = 'workflow-test-secret-that-is-at-least-32-characters';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.BUSINESS_TIMEZONE = 'Asia/Kolkata';
const { app } = require('../src/server') as typeof import('../src/server');
const { User, Employee, Manager, Attendance, Leave, Training, Notification } = require('../src/models') as typeof import('../src/models');
const secret = process.env.JWT_SECRET!;
const pass = 'Test-Only-Password-927!';
let people: Record<string, any>;
let profile: Record<string, any>;
let token: Record<string, string>;

const auth = (role: string) => ({ Authorization: `Bearer ${token[role]}` });

describe('StaffSync persisted API workflows (isolated MongoDB database)', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI!);
    const hash = await bcrypt.hash(pass, 4);
    people = {};
    profile = {};
    token = {};
    for (const [key, role] of [['hr', 'hr'], ['manager', 'manager'], ['employee', 'employee'], ['outsider', 'employee']] as const) {
      people[key] = await User.create({ name: key, email: `${key}-${runId}@test.staffsync`, role, passwordHash: hash, active: true });
      token[key] = jwt.sign({ sub: people[key].id }, secret, { expiresIn: '1h' });
      profile[key] = await Employee.create({ user: people[key]._id, employeeId: `T-${key}-${runId}`, department: 'Engineering', designation: key, manager: key === 'employee' ? undefined : undefined, status: 'active' });
    }
    profile.employee.manager = profile.manager._id;
    await profile.employee.save();
    await Attendance.create({ employee: profile.outsider._id, workDate: '2026-10-01', clockIn: new Date('2026-10-01T09:00:00Z'), clockOut: new Date('2026-10-01T17:00:00Z'), durationMinutes: 480 });
    await Leave.create({ employee: profile.outsider._id, leaveType: 'annual', startDate: new Date('2026-11-01'), endDate: new Date('2026-11-02'), reason: 'outsider fixture', status: 'pending' });
  });
  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  it('serves role-specific dashboards and denies the wrong role', async () => {
    expect((await request(app).get('/api/dashboard/hr').set(auth('hr'))).status).toBe(200);
    expect((await request(app).get('/api/dashboard/hr').set(auth('manager'))).status).toBe(403);
    await Employee.updateOne({ _id: profile.employee._id }, { salary: 75_000 });
    const manager = await request(app).get('/api/dashboard/manager').set(auth('manager'));
    expect(manager.status).toBe(200);
    expect(manager.body.teamMembers.map((x: any) => x.id)).toContain(profile.employee.id);
    expect(manager.body.teamMembers[0]).not.toHaveProperty('salary');
    const employee = await request(app).get('/api/dashboard/employee').set(auth('employee'));
    expect(employee.status).toBe(200);
    expect(employee.body).toHaveProperty('leaveBalance');
  });

  it('derives the employee leave dashboard from grouped database totals', async () => {
    await Leave.create([
      { employee: profile.employee._id, leaveType: 'annual', startDate: new Date('2027-01-01'), endDate: new Date('2027-01-02'), reason: 'phase3 approved annual', status: 'approved' },
      { employee: profile.employee._id, leaveType: 'sick', startDate: new Date('2027-01-03'), endDate: new Date('2027-01-03'), reason: 'phase3 approved sick', status: 'approved' },
      { employee: profile.employee._id, leaveType: 'annual', startDate: new Date('2027-01-04'), endDate: new Date('2027-01-04'), reason: 'phase3 pending', status: 'pending' },
    ]);
    const response = await request(app).get('/api/dashboard/employee').set(auth('employee'));
    expect(response.status).toBe(200);
    expect(response.body.leaveBalance).toMatchObject({ annual: 18, sick: 9, casual: 8 });
    expect(response.body.pendingLeavesCount).toBe(1);
    await Leave.deleteMany({ employee: profile.employee._id, reason: /^phase3 / });
  });

  it('indexes training end dates used by dashboard counts and catalog status filters', () => {
    const indexedFields = Training.schema.indexes().map(([fields]) => fields);
    expect(indexedFields).toContainEqual({ endDate: 1 });
  });

  it('counts only present-status team members in the manager dashboard metric', async () => {
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    await Attendance.create({ employee: profile.employee._id, workDate: today, clockIn: new Date(), status: 'late' });
    await Attendance.create({ employee: profile.outsider._id, workDate: today, clockIn: new Date(), status: 'present' });
    const teamUser = await User.create({ name: 'Present Team Member', email: `present-${runId}@test.staffsync`, role: 'employee', passwordHash: await bcrypt.hash(pass, 4) });
    const teamEmployee = await Employee.create({ user: teamUser._id, employeeId: `P-${runId}`, department: 'Engineering', designation: 'Team Member', manager: profile.manager._id });
    await Attendance.create({ employee: teamEmployee._id, workDate: today, clockIn: new Date(), status: 'present' });
    const manager = await request(app).get('/api/dashboard/manager').set(auth('manager'));
    expect(manager.status).toBe(200);
    expect(manager.body.teamPresentToday).toBe(1);
    await Attendance.deleteMany({ employee: { $in: [profile.employee._id, profile.outsider._id, teamEmployee._id] }, workDate: today });
    await Employee.deleteOne({ _id: teamEmployee._id });
    await User.deleteOne({ _id: teamUser._id });
  });

  it('rejects invalid, expired and disabled-account JWTs', async () => {
    expect((await request(app).get('/api/auth/me').set('Authorization', 'Bearer invalid')).status).toBe(401);
    const expired = jwt.sign({ sub: people.employee.id }, secret, { expiresIn: -1 });
    expect((await request(app).get('/api/auth/me').set('Authorization', `Bearer ${expired}`)).status).toBe(401);
    await User.findByIdAndUpdate(people.outsider.id, { active: false });
    expect((await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token.outsider}`)).status).toBe(401);
    await User.findByIdAndUpdate(people.outsider.id, { active: true });
  });

  it('validates API bodies, query enums, dates, IDs, and required fields at the boundary', async () => {
    expect((await request(app).get('/api/employees/not-an-object-id').set(auth('hr'))).status).toBe(400);
    expect((await request(app).get('/api/leaves?status=waiting').set(auth('hr'))).status).toBe(400);
    expect((await request(app).get('/api/attendance?startDate=2026-10-01').set(auth('hr'))).status).toBe(400);
    expect((await request(app).get('/api/reports/performance?startDate=2026-02-30&endDate=2026-03-01').set(auth('hr'))).status).toBe(400);
    expect((await request(app).post('/api/employees').set(auth('hr')).send({ name: 'Missing details' })).status).toBe(400);
    expect((await request(app).post('/api/leaves').set(auth('employee')).send({ leaveType: 'annual', startDate: '2026-02-30', endDate: '2026-03-01', reason: 'invalid date' })).status).toBe(400);
    expect((await request(app).post('/api/trainings').set(auth('manager')).send({ capacity: 0 })).status).toBe(400);
    expect((await request(app).patch(`/api/leaves/${profile.outsider.id}/decision`).set(auth('hr')).send({ status: 'waiting' })).status).toBe(400);
    const invalid = await request(app).post('/api/trainings').set(auth('manager')).send({ title: 'Extra field', admin: true });
    expect(invalid.status).toBe(400);
    expect(invalid.body).not.toHaveProperty('stack');
    expect((await request(app).post('/api/attendance/clock-in').set(auth('employee')).send({ employeeId: profile.outsider.id })).status).toBe(400);
    expect((await request(app).post('/api/trainings/not-an-object-id/enroll').set(auth('employee'))).status).toBe(400);
  });

  it('ignores privilege escalation through public registration', async () => {
    const response = await request(app).post('/api/auth/register').send({ name: 'Self Registered', email: `self-${runId}@test.staffsync`, password: pass, role: 'hr' });
    expect(response.status).toBe(201);
    expect(response.body.user.role).toBe('employee');
    expect((await User.findById(response.body.user.id))!.role).toBe('employee');
  });

  it('scopes employee records and manager directory results to their team', async () => {
    expect((await request(app).get(`/api/employees/${profile.employee.id}`).set(auth('employee'))).status).toBe(200);
    expect((await request(app).get(`/api/employees/${profile.outsider.id}`).set(auth('employee'))).status).toBe(403);
    const team = await request(app).get('/api/employees').set(auth('manager'));
    expect(team.status).toBe(200);
    expect(team.body.employees.map((x: any) => x.id)).toEqual([profile.employee.id]);
    expect((await request(app).get(`/api/employees/${profile.outsider.id}`).set(auth('manager'))).status).toBe(403);
    expect((await request(app).post('/api/employees').set(auth('manager')).send({ name: 'Forbidden', email: `no-${runId}@test.staffsync`, password: pass, department: 'Engineering', designation: 'Staff' })).status).toBe(403);
    const created = await request(app).post('/api/employees').set(auth('hr')).send({ name: 'Created by HR', email: `new-${runId}@test.staffsync`, password: pass, department: 'People', designation: 'Analyst', role: 'employee' });
    expect(created.status).toBe(201);
    expect((await request(app).get('/api/employees').set(auth('hr'))).body.employees).toEqual(expect.arrayContaining([expect.objectContaining({ email: `new-${runId}@test.staffsync` })]));
    const newId=(await Employee.findOne({user:(await User.findOne({email:`new-${runId}@test.staffsync`}))!._id}))!.id;
    const changed=await request(app).patch(`/api/employees/${newId}`).set(auth('hr')).send({designation:'Senior Analyst',role:'manager'});
    expect(changed.status).toBe(200);expect((await User.findById(changed.body.employee.user))!.role).toBe('manager');
    expect(await Manager.exists({ user: changed.body.employee.user, employee: newId })).toBeTruthy();
    const hiredManager = await request(app).post('/api/employees').set(auth('hr')).send({ name: 'Direct Manager Hire', email: `manager-new-${runId}@test.staffsync`, password: pass, department: 'People', designation: 'Team Lead', role: 'manager' });
    expect(hiredManager.status).toBe(201);
    expect(await Manager.exists({ user: hiredManager.body.employee.user, employee: hiredManager.body.employee.id })).toBeTruthy();
  });

  it('paginates with strict bounds, stable ordering, empty pages, and database-side team scope', async () => {
    const outsideUser = await User.create({ name: 'Unassigned Newer Employee', email: `unassigned-${runId}@test.staffsync`, role: 'employee', passwordHash: await bcrypt.hash(pass, 4) });
    await Employee.create({ user: outsideUser._id, employeeId: `U-${runId}`, department: 'Engineering', designation: 'Unassigned' });
    const first = await request(app).get('/api/employees?limit=1').set(auth('manager'));
    expect(first.status).toBe(200);
    expect(first.body).toMatchObject({ page: 1, limit: 1, total: 1, pages: 1 });
    expect(first.body.employees.map((row: any) => row.id)).toEqual([profile.employee.id]);
    const defaults = await request(app).get('/api/employees').set(auth('hr'));
    expect(defaults.body).toMatchObject({ page: 1, limit: 25 });
    const empty = await request(app).get('/api/employees?page=9&limit=1').set(auth('manager'));
    expect(empty.body).toMatchObject({ page: 9, limit: 1, total: 1, pages: 1, employees: [] });
    expect((await request(app).get('/api/employees?page=0').set(auth('hr'))).status).toBe(400);
    expect((await request(app).get('/api/employees?limit=101').set(auth('hr'))).status).toBe(400);
    expect((await request(app).get('/api/employees?limit=1.5').set(auth('hr'))).status).toBe(400);

    await Attendance.create({ employee: profile.employee._id, workDate: '2026-10-02', clockIn: new Date('2026-10-02T09:00:00Z'), status: 'present' });
    const managerAttendance = await request(app).get('/api/attendance?page=1&limit=1').set(auth('manager'));
    const hrAttendance = await request(app).get('/api/attendance?page=1&limit=1').set(auth('hr'));
    expect(managerAttendance.body).toMatchObject({ page: 1, limit: 1, total: 1, pages: 1 });
    expect(managerAttendance.body.records[0].employeeId).toBe(profile.employee.id);
    expect(hrAttendance.body.total).toBe(2);

    await Leave.create({ employee: profile.employee._id, leaveType: 'annual', startDate: new Date('2027-01-10'), endDate: new Date('2027-01-11'), reason: 'pagination team fixture', status: 'pending' });
    const managerLeaves = await request(app).get('/api/leaves?status=pending&page=1&limit=1').set(auth('manager'));
    expect(managerLeaves.body).toMatchObject({ page: 1, limit: 1, total: 1, pages: 1 });
    expect(managerLeaves.body.leaves[0].employeeId).toBe(profile.employee.id);

    await Notification.create({ recipient: people.employee._id, message: 'Employee-only fixture', readAt: null });
    await Notification.create({ recipient: people.outsider._id, message: 'Outsider fixture', readAt: null });
    const notifications = await request(app).get('/api/notifications?page=1&limit=1').set(auth('employee'));
    expect(notifications.body).toMatchObject({ page: 1, limit: 1, total: 1, unreadCount: 1 });
    expect((await request(app).patch('/api/notifications/read-all').set(auth('employee'))).status).toBe(200);
    expect(await Notification.countDocuments({ recipient: people.outsider._id, readAt: null })).toBe(1);

    const trainings = await Promise.all(['Stable A', 'Stable B', 'Stable C'].map((title) => Training.create({ title, capacity: 5, startDate: new Date('2026-12-01') })));
    const pageOne = await request(app).get('/api/trainings?limit=2').set(auth('employee'));
    const pageTwo = await request(app).get('/api/trainings?page=2&limit=2').set(auth('employee'));
    const ids = [...pageOne.body.trainings, ...pageTwo.body.trainings].map((x: any) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(pageOne.body).toMatchObject({ page: 1, limit: 2, total: expect.any(Number), pages: expect.any(Number) });
    const stableIds = trainings.map((training) => training.id).sort();
    expect(ids.filter((id: string) => stableIds.includes(id))).toEqual(stableIds);

    const noAnnouncements = await request(app).get('/api/announcements?page=3').set(auth('outsider'));
    expect(noAnnouncements.body).toMatchObject({ page: 3, limit: 25, total: 0, pages: 0, announcements: [] });
  });

  it('persists attendance transitions and prevents cross-team attendance reads', async () => {
    expect((await request(app).post('/api/attendance/clock-in').set(auth('employee'))).status).toBe(201);
    expect((await request(app).post('/api/attendance/clock-in').set(auth('employee'))).status).toBe(409);
    const out = await request(app).post('/api/attendance/clock-out').set(auth('employee'));
    expect(out.status).toBe(200);
    expect(out.body.attendance.workingHours).toBeGreaterThanOrEqual(0);
    expect((await request(app).get(`/api/attendance?employeeId=${profile.outsider.id}`).set(auth('manager'))).status).toBe(403);
    const hr = await request(app).get('/api/attendance?date=2026-10-01').set(auth('hr'));
    expect(hr.body.records.some((x: any) => x.employeeId === profile.outsider.id)).toBe(true);
  });

  it('handles leave application, manager/team decisions, atomic status and notifications', async () => {
    const payload = { leaveType: 'annual', startDate: '2026-12-10', endDate: '2026-12-11', reason: 'workflow test' };
    const applied = await request(app).post('/api/leaves').set(auth('employee')).send(payload);
    expect(applied.status).toBe(201);
    expect((await request(app).post('/api/leaves').set(auth('employee')).send(payload)).status).toBe(409);
    const outsiderLeave = await Leave.findOne({ employee: profile.outsider._id });
    expect((await request(app).get(`/api/leaves/${outsiderLeave!.id}`).set(auth('employee'))).status).toBe(403);
    expect((await request(app).patch(`/api/leaves/${outsiderLeave!.id}/decision`).set(auth('manager')).send({ status: 'approved' })).status).toBe(403);
    expect((await request(app).get('/api/leaves?employeeId=' + profile.outsider.id).set(auth('manager'))).status).toBe(403);
    const approved = await request(app).patch(`/api/leaves/${applied.body.leave.id}/decision`).set(auth('manager')).send({ status: 'approved' });
    expect(approved.status).toBe(200);
    expect(approved.body.leave.status).toBe('approved');
    expect((await request(app).patch(`/api/leaves/${applied.body.leave.id}/decision`).set(auth('manager')).send({ status: 'rejected' })).status).toBe(409);
    const notifications = await request(app).get('/api/notifications').set(auth('employee'));
    expect(notifications.body.notifications.some((x: any) => x.relatedResource === applied.body.leave.id)).toBe(true);
  });

  it('publishes audience-filtered announcements and prevents unauthorized creation', async () => {
    expect((await request(app).post('/api/announcements').set(auth('employee')).send({ title: 'no', content: 'no' })).status).toBe(403);
    const created = await request(app).post('/api/announcements').set(auth('hr')).send({ title: 'Employee notice', content: 'Visible to employees', targetAudience: 'employee', priority: 'urgent' });
    expect(created.status).toBe(201);
    expect((await request(app).get('/api/announcements').set(auth('employee'))).body.announcements).toEqual(expect.arrayContaining([expect.objectContaining({ id: created.body.announcement.id, priority: 'urgent' })]));
    expect((await request(app).get('/api/announcements').set(auth('manager'))).body.announcements.some((x: any) => x.id === created.body.announcement.id)).toBe(false);
  });

  it('creates trainings, prevents duplicate enrollment and isolates notifications', async () => {
    const created = await request(app).post('/api/trainings').set(auth('hr')).send({ title: 'Test class', description: 'Workflow', instructor: 'HR', startDate: '2026-12-01', endDate: '2026-12-02', capacity: 2, category: 'Test' });
    expect(created.status).toBe(201);
    expect((await request(app).post(`/api/trainings/${created.body.training.id}/enroll`).set(auth('employee'))).status).toBe(200);
    expect((await request(app).post(`/api/trainings/${created.body.training.id}/enroll`).set(auth('employee'))).status).toBe(409);
    expect((await request(app).post(`/api/trainings/${created.body.training.id}/enroll`).set(auth('outsider'))).status).toBe(200);
    expect((await request(app).post(`/api/trainings/${created.body.training.id}/enroll`).set(auth('manager'))).status).toBe(409);
    expect((await request(app).post('/api/trainings').set(auth('employee')).send({ title: 'Not allowed' })).status).toBe(403);
    const managerTraining = await request(app).post('/api/trainings').set(auth('manager')).send({ title: 'Manager workshop', capacity: 10, category: 'Team' });
    expect(managerTraining.status).toBe(201);
    const own = await request(app).get('/api/notifications').set(auth('employee'));
    const notificationId = own.body.notifications[0].id;
    expect((await request(app).get('/api/notifications').set(auth('outsider'))).body.notifications.some((x: any) => x.id === notificationId)).toBe(false);
    expect((await request(app).patch(`/api/notifications/${notificationId}/read`).set(auth('outsider'))).status).toBe(404);
    expect((await request(app).patch(`/api/notifications/${notificationId}/read`).set(auth('employee'))).status).toBe(200);
  });

  it('updates own profile and password, and scopes reports by manager team', async () => {
    const own = await request(app).patch('/api/auth/profile').set(auth('employee')).send({ name: 'Employee Updated', phone: '555-0110' });
    expect(own.status).toBe(200);
    expect((await request(app).get('/api/auth/me').set(auth('employee'))).body.user.name).toBe('Employee Updated');
    expect((await Employee.findById(profile.employee.id))!.phone).toBe('555-0110');
    expect((await request(app).patch('/api/auth/password').set(auth('employee')).send({ currentPassword: pass, newPassword: 'Changed-Test-Password-927!' })).status).toBe(200);
    expect((await request(app).post('/api/auth/login').send({ email: people.employee.email, password: pass })).status).toBe(401);
    expect((await request(app).post('/api/auth/login').send({ email: people.employee.email, password: 'Changed-Test-Password-927!' })).status).toBe(200);
    const managerReport = await request(app).get('/api/reports/attendance').set(auth('manager'));
    const hrReport = await request(app).get('/api/reports/attendance').set(auth('hr'));
    expect(managerReport.status).toBe(200);
    expect(hrReport.body.summary.totalWorkDays).toBeGreaterThan(managerReport.body.summary.totalWorkDays);
    expect((await request(app).get('/api/reports/leaves').set(auth('hr'))).status).toBe(200);
    expect((await request(app).get('/api/reports/attendance').set(auth('employee'))).status).toBe(403);
  });

  it('calculates attendance and activity indicators for date ranges with role and team boundaries', async () => {
    await Attendance.create({ employee: profile.employee._id, workDate: '2026-10-01', clockIn: new Date('2026-10-01T09:00:00Z'), status: 'late' });
    await Attendance.create({ employee: profile.outsider._id, workDate: '2026-10-02', clockIn: new Date('2026-10-02T09:00:00Z'), status: 'absent' });
    await Training.create({ title: 'Completed team course', capacity: 5, enrollments: [{ user: people.employee._id, completed: true, enrolledAt: new Date('2026-10-01T12:00:00Z') }] });
    const query = '?startDate=2026-10-01&endDate=2026-10-01';
    const manager = await request(app).get(`/api/reports/attendance${query}`).set(auth('manager'));
    expect(manager.status).toBe(200);
    expect(manager.body.summary.totalWorkDays).toBe(1);
    expect(manager.body.summary.totalAbsences).toBe(0);
    expect(manager.body.summary.avgAttendanceRate).toBe(100);
    expect(manager.body.monthlyTrends).toEqual([{ month: '2026-10', rate: 100 }]);
    const hrRange = await request(app).get('/api/reports/attendance?startDate=2026-10-01&endDate=2026-10-02').set(auth('hr'));
    expect(hrRange.body.summary.totalAbsences).toBe(1);
    expect(hrRange.body.summary.totalWorkDays).toBe(2);

    const managerPerformance = await request(app).get(`/api/reports/performance${query}`).set(auth('manager'));
    expect(managerPerformance.status).toBe(200);
    expect(managerPerformance.body.indicators).toHaveLength(1);
    expect(managerPerformance.body.indicators[0]).toMatchObject({
      employeeId: profile.employee.id,
      attendance: { recordedDays: 1, presentDays: 0, lateDays: 1, explicitAbsenceDays: 0, attendanceRate: 100 },
      training: { enrollments: 1, completed: 1 },
    });
    expect((await request(app).get(`/api/reports/performance${query}`).set(auth('employee'))).status).toBe(403);
    const hrPerformance = await request(app).get(`/api/reports/performance${query}`).set(auth('hr'));
    expect(hrPerformance.body.indicators.some((item: any) => item.employeeId === profile.outsider.id)).toBe(true);
    expect((await request(app).get(`/api/reports/attendance${query}`).set(auth('employee'))).status).toBe(403);
  });

  it('returns honest empty-range analytics and rejects malformed attendance ranges', async () => {
    const emptyQuery = '?startDate=2025-01-01&endDate=2025-01-07';
    const report = await request(app).get(`/api/reports/attendance${emptyQuery}`).set(auth('hr'));
    expect(report.status).toBe(200);
    expect(report.body.summary).toMatchObject({ totalWorkDays: 0, avgAttendanceRate: null, totalAbsences: 0, totalLateArrivals: 0 });
    expect(report.body.monthlyTrends).toEqual([]);
    const performance = await request(app).get(`/api/reports/performance${emptyQuery}`).set(auth('manager'));
    expect(performance.status).toBe(200);
    expect(performance.body.indicators[0].attendance).toMatchObject({ recordedDays: 0, attendanceRate: null });
    expect((await request(app).get('/api/reports/attendance?startDate=2026-02-30&endDate=2026-03-01').set(auth('hr'))).status).toBe(400);
    expect((await request(app).get('/api/reports/performance?startDate=2026-10-02&endDate=2026-10-01').set(auth('manager'))).status).toBe(400);
  });
});
