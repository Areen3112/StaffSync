# Phase 4 QA record

## Automated and live API checks

- Backend Jest workflows use a randomized, isolated MongoDB test database and remove that test database after the suite. They cover authentication, profile/password updates, employee and manager creation, attendance transitions, leave application and decisions, notifications, audience-filtered announcements, training creation/enrollment, analytics, team boundaries, validation, pagination, and role denial.
- Live API checks against the existing local application verified login, `/auth/me`, and logout acknowledgement for the four documented demo accounts. Passwords and JWTs were kept out of output.
- Read-only live role smoke checks returned 200 from the expected dashboard and list/report endpoints for HR, manager, and both employee accounts. No write workflow was run against the user's `staffsync` database.
- Isolated API tests verify employee denial of HR reports, manager team scoping, cross-team attendance and leave denial, unauthorized leave decisions, invalid/expired JWTs, and HR-only employee management.
- `POST /auth/logout` is stateless on the server. The client clears its session token; logout does not revoke a JWT copied before logout.

## Browser and responsive checks

The in-app browser exercised the public login, registration, and landing pages from a separately built local production copy. Viewports checked were 1440×900 (desktop), 768×1024 (tablet), and 390×844 (mobile). All nine page/viewport combinations had no horizontal document overflow. Login validation correctly required a password. The password helper and label overlapped visually at 390px; the helper now wraps below the label on mobile, and the corrected layout was verified in the isolated production copy.

Authenticated dashboard, forms, pagination, notifications, and role-specific menus were not visually exercised in a browser. The current browser login page did not have a password entered, and no secret was typed through browser automation. Their API-backed behavior is covered by isolated HTTP tests; this is not a substitute for authenticated visual QA.

## Manual browser checklist remaining

Use the local credentials from the private development environment, then repeat at desktop (1440×900), tablet (768×1024), and mobile (390×844):

1. Sign in separately as HR, manager, and employee; verify each role's navigation, dashboard, loading/empty/error states, and logout redirect.
2. As employee, view/edit permitted profile fields, clock in and out, inspect attendance/leave status, and open announcements, trainings, and notifications.
3. As manager, inspect the team roster and reports, approve/reject a pending team leave, and create a training. Confirm an employee cannot create training or access HR reports.
4. As HR, create/manage a test employee and manager, review attendance/leave reports, publish a test announcement, and manage a test training.
5. On the paginated directory, attendance, leave, announcement, training, report, and notification views, change page/filter and verify results and boundary states.
6. Check for clipped cards, unreadable text, unreachable controls, and horizontal overflow after authenticated content loads.

Run the above mutations only in an isolated QA database or with clearly disposable test records. No user development data was created, edited, or deleted during this QA pass.

## Submission limitations

- No deployment was performed; production hosting, HTTPS, secret provisioning, and indexes still require operator setup.
- The backend does not revoke JWTs on logout and the browser stores tokens in `sessionStorage`, not an HTTP-only cookie.
- Production auto-index creation is disabled; deployment must apply reviewed schema indexes explicitly. No migration was run.
- The in-app browser check covered public pages and responsive overflow, not authenticated dashboard layouts or mutations.
