# Frontend integration map

The frontend service layer and `docs/api-contract.md` are the contract baseline. The backend returns JSON `{ success: true, ...payload }`; errors return `{ success: false, message, errors? }`.

| Route/component | Data/actions | HTTP | Access and UI behavior |
|---|---|---|---|
| `/login` | credentials, current user, logout | POST `/api/auth/login`, GET `/api/auth/me`, POST `/api/auth/logout` | Public login, authenticated identity; preserve token session and show errors. |
| `/register` | create account | POST `/api/auth/register` | Public registration restricted to employee role; HR/manager creation through employee management only. |
| `/dashboard` | metrics, today's status, clock toggle, team leave decision | GET `/api/dashboard/{hr,manager,employee}`, GET `/api/attendance/today`, POST `/api/attendance/clock-{in,out}`, PATCH `/api/leaves/:id/decision` | Role scoped; reload metrics only after confirmed mutation. |
| `/employees` | search, department/role filters, pages, create/edit | GET/POST `/api/employees`, GET/PATCH `/api/employees/:id` | HR manage; manager team read; employee own profile; display request errors. |
| `/attendance` | status, history/date filter, clock | GET `/api/attendance`, GET `/api/attendance/today`, POST `/api/attendance/clock-{in,out}` | Own/team/org scope by role. |
| `/leaves` | list/status filter, balance, apply, detail, decision | GET/POST `/api/leaves`, GET `/api/leaves/:id`, PATCH `/api/leaves/:id/decision` | Owner submit/read; manager assigned team and HR review. |
| `/announcements` | audience-filtered list, create | GET/POST `/api/announcements`, PATCH `/api/announcements/:id` | Published audience view; HR/manager publish; HR edit. |
| `/trainings` | list, create, enrollment | GET/POST `/api/trainings`, POST `/api/trainings/:id/enroll` | Authenticated view/enroll; HR/manager create; unique enrollment. |
| `/reports` | attendance and leave aggregates | GET `/api/reports/attendance`, GET `/api/reports/leaves` | HR organization; manager scoped team. |
| `/settings` | own profile/password | PATCH `/api/auth/profile`, PATCH `/api/auth/password` | Authenticated self-service; only show success after API response. |
| Shared header/layout | notifications | GET `/api/notifications`, PATCH `/api/notifications/:id/read` | Recipient only. |

Queries: employee filters `search,department,role,page,limit`; attendance `date,startDate,endDate,employeeId`; leaves `status,employeeId`; reports `startDate,endDate,department` and `year`.

The existing frontend service adapters should remain the only API call boundary. Their development fallback is temporary and should be explicitly enabled; disabling it ensures API errors propagate. Backend-only health endpoint is GET `/api/health`.
