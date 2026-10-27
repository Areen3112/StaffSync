# Database schema

MongoDB collections use Mongoose timestamps and ObjectId references. Password hashes are excluded from normal user queries.

- `users`: unique normalized email, name, bcrypt hash, role, active flag.
- `employees`: unique user and employeeId, department, designation, phone, joining date, manager employee reference, status and optional salary.
- `managers`: unique user reference, employee profile and assigned departments.
- `attendances`: employee, business-local YYYY-MM-DD key, UTC clock timestamps, status and calculated minutes; unique `(employee, workDate)` prevents duplicate clock-ins.
- `leaves`: employee, type, date range, reason, pending/approved/rejected status and reviewer metadata.
- `announcements`: author, audience filters, publication status/date, content.
- `trainings`: schedule, capacity, creator, embedded per-user enrollments and completion state.
- `notifications`: recipient, type, message, optional resource and read timestamp.

Indexes cover unique email/employee IDs, manager and department employee listings, attendance date ranges and employee/day uniqueness, leave status/date filters, announcement audiences, training start/end-date filters and enrollment lookups, and recipient notification ordering/unread queries. The training `endDate` index supports the upcoming-training dashboard counts and catalog status filters; the `startDate` index supports catalog ordering. Manager relationships reference employee records; no credentials or identity are duplicated in the managers collection.

`BUSINESS_TIMEZONE` controls the local attendance date while recorded event times remain UTC.
