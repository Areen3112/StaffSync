# Role permissions

| Capability | HR | Manager | Employee |
|---|---|---|---|
| Login/current profile | Yes | Yes | Yes |
| Create employee/user records | Yes, any assigned role | No | No |
| Directory | Organization | Assigned team only | Own record only |
| Attendance history | Organization | Assigned team; rejects out-of-team employee filters | Own |
| Clock own attendance | Yes, personal profile | Yes, personal profile | Yes |
| Submit/view leave | Own; organization read | Own and assigned team | Own |
| Decide leave | Any pending request | Assigned team only | No |
| Publish announcements | Yes | Yes | No |
| Create training | Yes | Yes | No |
| Enroll training | Yes | Yes | Yes; duplicate/capacity checks are atomic |
| Notifications | Own | Own | Own |
| Reports | Organization | Assigned team | No |

Every protected endpoint verifies the bearer JWT and active account. Employee detail and profile routes enforce ownership. Public registration ignores client-supplied role and only creates employee accounts. HR role changes require the protected HR employee-management endpoint. Manager scope is derived from the manager's employee profile and the target employee's manager reference; client-supplied filters cannot widen that scope.
