import mongoose, { Schema } from 'mongoose';

const opts = { timestamps: true, versionKey: false } as const;

const UserSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['hr', 'manager', 'employee'], default: 'employee' },
  active: { type: Boolean, default: true },
}, opts);
UserSchema.index({ role: 1, active: 1, _id: 1 });
export const User = mongoose.model('User', UserSchema);

const EmployeeSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  employeeId: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  designation: { type: String, required: true },
  phone: String,
  joiningDate: { type: Date, default: Date.now },
  manager: { type: Schema.Types.ObjectId, ref: 'Employee' },
  status: { type: String, enum: ['active', 'inactive', 'on_leave'], default: 'active' },
  salary: Number,
}, opts);
EmployeeSchema.index({ manager: 1, createdAt: -1, _id: -1 });
EmployeeSchema.index({ department: 1, createdAt: -1, _id: -1 });
EmployeeSchema.index({ createdAt: -1, _id: -1 });
export const Employee = mongoose.model('Employee', EmployeeSchema);

const ManagerSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  departments: [String],
}, opts);
export const Manager = mongoose.model('Manager', ManagerSchema);

const AttendanceSchema = new Schema({
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  workDate: { type: String, required: true },
  clockIn: { type: Date, required: true },
  clockOut: Date,
  status: { type: String, enum: ['present', 'late', 'absent'], default: 'present' },
  durationMinutes: { type: Number, default: 0 },
}, opts);
AttendanceSchema.index({ employee: 1, workDate: 1 }, { unique: true });
AttendanceSchema.index({ workDate: -1, _id: -1 });
export const Attendance = mongoose.model('Attendance', AttendanceSchema);

const LeaveSchema = new Schema({
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  leaveType: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewer: { type: Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
  reviewerComment: String,
}, opts);
LeaveSchema.index({ employee: 1, status: 1, createdAt: -1, _id: -1 });
LeaveSchema.index({ employee: 1, createdAt: -1, _id: -1 });
LeaveSchema.index({ status: 1, createdAt: -1, _id: -1 });
LeaveSchema.index({ status: 1, startDate: 1, endDate: 1 });
LeaveSchema.index({ createdAt: -1, _id: -1 });
export const Leave = mongoose.model('Leave', LeaveSchema);

const AnnouncementSchema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  targetAudience: { type: String, enum: ['all', 'department', 'role'], default: 'all' },
  department: String,
  role: String,
  priority: { type: String, enum: ['normal', 'urgent'], default: 'normal' },
  status: { type: String, enum: ['published', 'draft'], default: 'published' },
  publishedAt: { type: Date, default: Date.now },
}, opts);
AnnouncementSchema.index({ status: 1, targetAudience: 1, publishedAt: -1, _id: -1 });
export const Announcement = mongoose.model('Announcement', AnnouncementSchema);

const TrainingSchema = new Schema({
  title: { type: String, required: true },
  description: String,
  instructor: String,
  startDate: Date,
  endDate: Date,
  capacity: { type: Number, default: 25 },
  category: String,
  creator: { type: Schema.Types.ObjectId, ref: 'User' },
  enrollments: [{ user: { type: Schema.Types.ObjectId, ref: 'User' }, completed: { type: Boolean, default: false }, enrolledAt: { type: Date, default: Date.now } }],
}, opts);
TrainingSchema.index({ startDate: 1, _id: 1 });
TrainingSchema.index({ endDate: 1 });
TrainingSchema.index({ 'enrollments.user': 1, 'enrollments.enrolledAt': 1 });
export const Training = mongoose.model('Training', TrainingSchema);

const NotificationSchema = new Schema({
  recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: String,
  message: { type: String, required: true },
  relatedResource: String,
  readAt: Date,
}, opts);
NotificationSchema.index({ recipient: 1, readAt: 1 });
NotificationSchema.index({ recipient: 1, createdAt: -1, _id: -1 });
export const Notification = mongoose.model('Notification', NotificationSchema);
