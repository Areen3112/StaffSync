# Frontend audit

## Project inventory

- Next.js 15 App Router, React 19, TypeScript 5.7, Sass modules, Redux Toolkit and Axios.
- Frontend root is this repository root. The shared API layer is src/services; UI pages and styling remain intact.
- Routes: / landing/redirect, /login, /register, /dashboard, /employees, /attendance, /leaves, /announcements, /trainings, /reports, /settings.
- Shared UI: src/components/layout (sidebar/header/app layout/auth guard) and src/components/ui (modal/toasts). Global styles and tokens are under src/styles.

## Data and action inventory

| Route | Data and actions | Current integration |
|---|---|---|
| / | Entry/redirect | Existing static route. |
| /login | Credential login, role dashboard redirect, restored user | Auth service POSTs login and GETs current user. Password is not prefilled. |
| /register | New account registration | API only permits employee role, regardless of requested browser role. |
| /dashboard | HR/manager/employee metrics, today's timecard, team leave actions | Role-scoped dashboard and attendance/decision APIs. |
| /employees | Search, department/role filters, list, create/edit/detail | API pagination/filtering; HR mutates, manager team view. "all" filter values are supported. |
| /attendance | Clock, today status, history/date filter | API-backed attendance status and history. |
| /leaves | Apply, status filter/list/balance, review/decision | API-backed with owner/team/HR scoping. |
| /announcements | Audience-filtered feed/create | API-backed; frontend role audiences map to role-targeted records. |
| /trainings | Upcoming/completed/all, create, enroll | API-backed; enrollment has server-side duplicate and capacity checks. |
| /reports | Attendance and leave aggregates, CSV export | API-backed; manager aggregate scope follows assigned team. |
| /settings | Own profile, password update, logout | Profile/password mutations call the backend; success is shown after a successful response. |
| Shared header | Notifications | API-backed recipient-specific list/read operations. |

## Original implementation findings

At initial inspection, the frontend had service modules but no backend. API failures could fall back to module-memory mock records when NEXT_PUBLIC_ENABLE_DEMO_FALLBACK=true; profile/password settings were simulated locally. Login state used sessionStorage. Several page fetch handlers catch errors silently, so an API failure can still look like an empty page. This fallback is disabled in the local .env.local; failures are not converted to fake records.

## Current environment and remaining gaps

The local frontend API URL points to localhost:5001 and NEXT_PUBLIC_ENABLE_DEMO_FALLBACK=false. The backend uses bearer JWTs held in sessionStorage; 401 responses clear the token and redirect to login. Frontend routes and the core corresponding data views were exercised in the browser against the local API.

The remaining UI limitation is inconsistent fetch-error presentation on several pages that swallow errors. The report's absent-day calculation is limited to saved attendance rows; no attendance record is not automatically classified as an absence. See docs/api-contract.md for other deliberate development limits.
