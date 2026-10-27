# StaffSync API contract

Base URL is configured by NEXT_PUBLIC_API_URL (local development: http://localhost:5001/api). Success responses use `{success:true,...payload}`; validation errors use `{success:false,message:'Invalid request',errors:[{field,message}]}` and do not include stack traces or database details. Protected requests use a bearer JWT with an eight-hour expiry. Logout acknowledges and the frontend discards the token; JWT expiry or invalidity returns 401 and the frontend redirects to login.

| Method/path | Access | Behavior |
|---|---|---|
| POST /auth/login | Public, rate limited | email/password, returns token and current profile. |
| POST /auth/register | Public, rate limited | Creates employee-role account only; ignores requested role. |
| GET /auth/me | Authenticated | Current user and employee profile. |
| POST /auth/logout | Authenticated | Stateless acknowledgement. |
| PATCH /auth/profile | Authenticated | Update own name and phone. |
| PATCH /auth/password | Authenticated | Verify current password and hash new password. |
| GET /employees | HR organization; manager assigned team | search, department, role, page, limit. Manager and department filters are applied before pagination. |
| POST /employees | HR | Creates user/profile; body includes name,email,password,department,designation and optional role. |
| GET /employees/:id | HR; own employee; assigned manager | Resource-scoped profile retrieval. |
| PATCH /employees/:id | HR; owner (phone/name only) | HR updates profile and role. Manager with assigned reports cannot be demoted until those reports are reassigned. |
| GET /attendance/today | Authenticated | Own attendance for business-local day. |
| GET /attendance | HR organization; manager assigned team; employee own | date or paired startDate/endDate, employeeId, page, limit; cross-team manager employee filters return 403. |
| POST /attendance/clock-in, POST /attendance/clock-out | Authenticated employee | Persisted state transition; unique employee/day index prevents duplicate clock-in. |
| GET /leaves | HR organization; manager team; employee own | status/employeeId filters, page, limit and own leave balance. Out-of-team manager filters return 403. |
| POST /leaves | Authenticated employee | Apply with leaveType,startDate,endDate,reason; validates reversed/overlapping dates. |
| GET /leaves/:id | HR; owner; assigned manager | Resource-scoped detail. |
| PATCH /leaves/:id/decision | HR; assigned manager | Atomic pending-to-approved/rejected decision; creates a recipient notification. |
| GET /announcements | Authenticated audience match | Published all/role/department audience records with page, limit. |
| POST /announcements | HR/manager | Publish title,content,targetAudience,priority. UI role audiences map to role-scoped records. |
| PATCH /announcements/:id | HR | Update announcement. |
| GET /trainings | Authenticated | Upcoming/completed/all status filter, page, limit and per-user enrollment status. |
| POST /trainings | HR/manager | Create training program. |
| POST /trainings/:id/enroll | Authenticated | Atomic duplicate/capacity-checked enrollment. |
| GET /notifications | Authenticated recipient only | Recipient's notifications, unread count, page and limit. |
| PATCH /notifications/:id/read | Authenticated recipient only | Mark own notification read; other recipients receive 404. |
| PATCH /notifications/read-all | Authenticated recipient only | Mark only the current recipient's notifications read. |
| GET /dashboard/employee | Authenticated | Current employee dashboard. |
| GET /dashboard/manager | Manager/HR | Team dashboard; manager team is assigned employee profiles. Present-today counts only records with status `present`. |
| GET /dashboard/hr | HR | Organization dashboard; weekly attendance covers the last 7 business-local dates and uses saved attendance records only. |
| GET /reports/attendance | HR organization; manager assigned team | Supports paired ISO `startDate`/`endDate`. Absences count only explicit saved `absent` records; attendance rate is present + late divided by saved attendance records. A rate is null when there are no records. |
| GET /reports/performance | HR organization; manager assigned team | Optional paired ISO `startDate`/`endDate`; defaults to the last 30 dates. Returns recorded attendance and training enrollment/completion counts, with no composite performance score; employee rows are paginated. |
| GET /reports/leaves | HR organization; manager assigned team | Leave aggregates; supports year. |
| GET /health | Public | API status and MongoDB connection state. |

Remaining constraints: leave allocations are a fixed development policy (annual 20, sick 10, casual 8); attendance analytics only derive from saved attendance rows and do not infer absence on unrecorded dates because work schedules/expected workdays are not modeled. Attendance rates describe the mix of saved records, not the share of scheduled shifts attended. The performance report provides activity indicators only; attendance and training participation do not measure productivity or overall performance. Leave overlap prevention is checked before insert but not protected against two concurrent overlapping submissions. Use a replica set plus transaction or a dedicated scheduling lock if concurrent leave submission must be strictly serialized in production. This application is verified for local demonstration, not production deployment.

## Pagination and validation

Paginated list endpoints default to `page=1` and `limit=25`; valid limits are 1–100. Responses retain their existing list fields and add flat `page`, `limit`, `total`, and `pages` fields. Invalid, fractional, zero, negative, or over-maximum pagination values return 400. Search/status/audience/team filters are applied before skip/limit. Ordering is deterministic with an `_id` tie-breaker. Attendance and leave report aggregates remain unpaginated because they return grouped summaries, not record lists; dashboard summaries remain intentionally bounded.

API bodies, list/report queries, status values, date ranges, and MongoDB path/body identifiers are validated with the existing Zod dependency. Dates must be real ISO `YYYY-MM-DD` calendar dates; range endpoints must be supplied together and ordered. The backend returns safe generic errors for database validation/cast failures and internal failures.

## Indexes

Schema indexes support user role/active lookups, employee manager/department directory filters and stable ordering, attendance employee/date uniqueness and date ordering, leave employee/status/date ordering and overlap/status lookups, announcement audience feeds, training catalog ordering/enrollment date lookups, and recipient notification ordering/unread counts. The new indexes are non-unique; existing unique email, employee/user, employeeId, manager/user, and employee/workDate constraints are unchanged. No database reset or index migration was run as part of this change.
