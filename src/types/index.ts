// Core Type Definitions for StaffSync Frontend

export type UserRole = 'hr' | 'manager' | 'employee';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  designation: string;
  avatarUrl?: string;
  phone?: string;
  joiningDate?: string;
  managerId?: string;
}

export type EmployeeStatus = 'active' | 'inactive' | 'on_leave';

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  designation: string;
  status: EmployeeStatus;
  phone: string;
  joiningDate: string;
  salary?: number;
  managerId?: string;
  managerName?: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName?: string;
  department?: string;
  date: string; // YYYY-MM-DD
  clockIn: string; // ISO or HH:mm
  clockOut?: string | null;
  status: AttendanceStatus;
  workingHours?: number;
}

export type LeaveType = 'sick' | 'casual' | 'annual' | 'maternity' | 'paternity' | 'unpaid';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName?: string;
  department?: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  status: LeaveStatus;
  reviewerComment?: string;
  appliedAt: string;
  reviewedAt?: string;
  reviewerName?: string;
}

export interface LeaveBalance {
  sick: number;
  casual: number;
  annual: number;
  remaining: number;
  total: number;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  targetAudience: 'all' | 'hr' | 'manager' | 'employee';
  priority: 'normal' | 'urgent';
  authorName: string;
  createdAt: string;
}

export interface TrainingProgram {
  id: string;
  title: string;
  description: string;
  instructor: string;
  startDate: string;
  endDate: string;
  capacity: number;
  enrolledCount: number;
  category: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  isEnrolled?: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'leave' | 'attendance' | 'training' | 'announcement';
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export interface HRDashboardMetrics {
  totalEmployees: number;
  activeEmployees: number;
  onLeaveCount: number;
  attendanceRate: number | null;
  pendingLeavesCount: number;
  activeAnnouncementsCount: number;
  activeTrainingsCount: number;
  departmentBreakdown: { department: string; count: number }[];
  weeklyAttendance: { day: string; date: string; rate: number | null; recordedCount: number; presentCount: number; lateCount: number; absenceCount: number }[];
}

export interface ManagerDashboardMetrics {
  teamSize: number;
  teamPresentToday: number;
  teamOnLeaveToday: number;
  pendingLeavesCount: number;
  teamMembers: Employee[];
  upcomingTrainings: TrainingProgram[];
}

export interface EmployeeDashboardMetrics {
  todayAttendance: AttendanceRecord | null;
  leaveBalance: LeaveBalance;
  pendingLeavesCount: number;
  upcomingTrainingsCount: number;
  recentAnnouncements: Announcement[];
}
