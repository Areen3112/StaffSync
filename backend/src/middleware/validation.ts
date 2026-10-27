import { NextFunction, Request, Response } from 'express';
import { z, ZodTypeAny } from 'zod';

const validDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

export const idSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Must be a valid identifier');
export const dateSchema = z.string().refine(validDate, 'Must be a real YYYY-MM-DD date');
const optionalDate = z.preprocess((value) => value === '' ? undefined : value, dateSchema.optional());
const optionalText = (max: number) => z.string().trim().max(max).optional();
const pageQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});
const dateRangeFields = { startDate: optionalDate, endDate: optionalDate };
const withDateRange = <T extends z.ZodRawShape>(shape: T) => z.object(shape).strict().superRefine((value, ctx) => {
  const range = value as { startDate?: string; endDate?: string };
  if ((range.startDate && !range.endDate) || (!range.startDate && range.endDate)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'startDate and endDate must be provided together', path: ['startDate'] });
  } else if (range.startDate && range.endDate && range.startDate > range.endDate) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'startDate must be on or before endDate', path: ['startDate'] });
  }
});

export const requestSchemas = {
  login: { body: z.object({ email: z.string().trim().email().max(254), password: z.string().min(1).max(256) }).strict() },
  register: { body: z.object({ name: z.string().trim().min(1).max(120), email: z.string().trim().email().max(254), password: z.string().min(8).max(256), department: z.string().trim().min(1).max(100).optional(), role: z.enum(['hr', 'manager', 'employee']).optional() }).strict() },
  profile: { body: z.object({ name: z.string().trim().min(1).max(120).optional(), phone: z.string().trim().max(40).nullable().optional() }).strict().refine((v) => v.name !== undefined || v.phone !== undefined, 'Provide at least one profile field') },
  password: { body: z.object({ currentPassword: z.string().min(1).max(256), newPassword: z.string().min(8).max(256) }).strict() },
  employeesList: { query: pageQuery.extend({ search: optionalText(100), department: optionalText(100), role: z.enum(['all', 'hr', 'manager', 'employee']).optional() }).strict() },
  employeeCreate: { body: z.object({ name: z.string().trim().min(1).max(120), email: z.string().trim().email().max(254), password: z.string().min(8).max(256), role: z.enum(['hr', 'manager', 'employee']).optional(), department: z.string().trim().min(1).max(100), designation: z.string().trim().min(1).max(120), employeeId: z.string().trim().min(1).max(40).optional(), phone: z.string().trim().max(40).optional(), joiningDate: optionalDate, managerId: idSchema.optional(), status: z.enum(['active', 'inactive', 'on_leave']).optional(), salary: z.coerce.number().finite().min(0).max(1_000_000_000).optional() }).strict() },
  employeeId: { params: z.object({ id: idSchema }).strict() },
  employeePatch: { params: z.object({ id: idSchema }).strict(), body: z.object({ id: idSchema.optional(), userId: idSchema.optional(), email: z.string().email().optional(), name: z.string().trim().min(1).max(120).optional(), role: z.enum(['hr', 'manager', 'employee']).optional(), department: z.string().trim().min(1).max(100).optional(), designation: z.string().trim().min(1).max(120).optional(), phone: z.string().trim().max(40).nullable().optional(), joiningDate: optionalDate, manager: idSchema.nullable().optional(), managerId: idSchema.optional(), managerName: z.string().max(120).optional(), status: z.enum(['active', 'inactive', 'on_leave']).optional(), salary: z.coerce.number().finite().min(0).max(1_000_000_000).optional() }).strict().refine((v) => Object.keys(v).some((key) => !['id', 'userId', 'email', 'managerName'].includes(key)), 'Provide at least one editable field') },
  attendanceList: { query: withDateRange({ ...pageQuery.shape, ...dateRangeFields, date: optionalDate, employeeId: idSchema.optional() }).superRefine((value, ctx) => { if (value.date && (value.startDate || value.endDate)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Use date or a startDate/endDate range, not both', path: ['date'] }); if ((value.startDate && !value.endDate) || (!value.startDate && value.endDate)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'startDate and endDate must be provided together', path: ['startDate'] }); if (value.startDate && value.endDate && value.startDate > value.endDate) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'startDate must be on or before endDate', path: ['startDate'] }); }) },
  emptyBody: { body: z.object({}).strict() },
  leaveList: { query: pageQuery.extend({ status: z.enum(['all', 'pending', 'approved', 'rejected']).optional(), employeeId: idSchema.optional() }).strict() },
  leaveCreate: { body: z.object({ leaveType: z.enum(['annual', 'sick', 'casual', 'maternity', 'paternity', 'unpaid']), startDate: dateSchema, endDate: dateSchema, reason: z.string().trim().min(1).max(2000) }).strict().refine((v) => v.startDate <= v.endDate, { message: 'startDate must be on or before endDate', path: ['startDate'] }) },
  leaveDecision: { params: z.object({ id: idSchema }).strict(), body: z.object({ status: z.enum(['approved', 'rejected']), reviewerComment: z.string().trim().max(1000).optional() }).strict() },
  leaveId: { params: z.object({ id: idSchema }).strict() },
  announcementList: { query: pageQuery.strict() },
  announcementCreate: { body: z.object({ title: z.string().trim().min(1).max(200), content: z.string().trim().min(1).max(10_000), targetAudience: z.enum(['all', 'department', 'hr', 'manager', 'employee']).default('all'), department: z.string().trim().min(1).max(100).optional(), priority: z.enum(['normal', 'urgent']).default('normal') }).strict().refine((v) => v.targetAudience !== 'department' || !!v.department, { message: 'department is required for a department announcement', path: ['department'] }) },
  announcementPatch: { params: z.object({ id: idSchema }).strict(), body: z.object({ title: z.string().trim().min(1).max(200).optional(), content: z.string().trim().min(1).max(10_000).optional(), targetAudience: z.enum(['all', 'department', 'hr', 'manager', 'employee']).optional(), department: z.string().trim().min(1).max(100).optional(), priority: z.enum(['normal', 'urgent']).optional(), status: z.enum(['published', 'draft']).optional() }).strict().refine((v) => Object.keys(v).length > 0, 'Provide at least one field to update').refine((v) => v.targetAudience !== 'department' || !!v.department, { message: 'department is required when setting a department audience', path: ['department'] }) },
  trainingList: { query: pageQuery.extend({ status: z.enum(['all', 'upcoming', 'completed']).optional() }).strict() },
  trainingCreate: { body: z.object({ title: z.string().trim().min(1).max(200), description: z.string().trim().max(5000).optional(), instructor: z.string().trim().max(120).optional(), startDate: optionalDate, endDate: optionalDate, capacity: z.coerce.number().int().min(1).max(100_000).default(25), category: z.string().trim().max(100).optional() }).strict().refine((v) => (!!v.startDate) === (!!v.endDate), { message: 'startDate and endDate must be provided together', path: ['startDate'] }).refine((v) => !v.startDate || !v.endDate || v.startDate <= v.endDate, { message: 'startDate must be on or before endDate', path: ['startDate'] }) },
  trainingId: { params: z.object({ id: idSchema }).strict() },
  notificationList: { query: pageQuery.strict() },
  notificationId: { params: z.object({ id: idSchema }).strict() },
  reportAttendance: { query: withDateRange({ ...dateRangeFields }) },
  reportPerformance: { query: withDateRange({ ...pageQuery.shape, ...dateRangeFields, employeeId: idSchema.optional() }) },
  reportLeaves: { query: z.object({ year: z.coerce.number().int().min(1900).max(2200).optional() }).strict() },
};

export type RequestSchemaSet = { body?: ZodTypeAny; params?: ZodTypeAny; query?: ZodTypeAny };

export function validateRequest(schemas: RequestSchemaSet) {
  return (req: Request, res: Response, next: NextFunction) => {
    const validated: Record<string, unknown> = {};
    for (const key of ['params', 'query', 'body'] as const) {
      const schema = schemas[key];
      if (!schema) continue;
      const result = schema.safeParse(key === 'body' ? (req.body ?? {}) : req[key]);
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request',
          errors: result.error.issues.map((issue) => ({ field: issue.path.join('.') || key, message: issue.message })),
        });
      }
      validated[key] = result.data;
      if (key === 'body') req.body = result.data;
    }
    res.locals.validated = validated;
    next();
  };
}

export function pagination(page: number, limit: number, total: number) {
  return { page, limit, total, pages: Math.ceil(total / limit) };
}
