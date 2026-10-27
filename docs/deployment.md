# Deployment readiness

StaffSync has no platform-specific deployment manifests and has not been deployed. Production rollout requires an HTTPS frontend, an API reachable from that frontend, MongoDB access, private environment variables, and a controlled index rollout.

## Environment variables

| Service | Variable | Production value and handling |
|---|---|---|
| Frontend | `NEXT_PUBLIC_API_URL` | HTTPS API base URL ending in `/api`. This value is embedded at build time and is public. |
| Frontend | `NEXT_PUBLIC_ENABLE_DEMO_FALLBACK` | Set to `false`; do not ship mock fallbacks as a substitute for API failures. |
| Backend | `NODE_ENV` | `production`. This disables automatic Mongoose index creation on server startup. |
| Backend | `PORT` | Port assigned by the hosting platform or reverse proxy. |
| Backend | `MONGODB_URI` | Private MongoDB connection string supplied through the host's secret manager. |
| Backend | `JWT_SECRET` | Private, high-entropy value of at least 32 characters supplied through the secret manager. Never commit it. |
| Backend | `FRONTEND_URL` | Exact HTTPS origin of the deployed frontend, with no path. Required. |
| Backend | `FRONTEND_URLS` | Optional comma-separated list of additional exact HTTPS origins. Do not use `*`. |
| Backend | `BUSINESS_TIMEZONE` | IANA timezone used to determine the attendance work date. |

Local development additionally uses `DEMO_PASSWORD` for the development-only seed script. Do not configure or run the seed script in production. The seed script is restricted to the local `staffsync` database and development mode.

## Local commands

Start MongoDB on macOS and check it:

```sh
brew services start mongodb-community@8.0
mongosh 'mongodb://127.0.0.1:27017/staffsync' --quiet --eval 'db.adminCommand({ping:1})'
```

Start the backend from the repository root:

```sh
cd backend && npm run dev
```

Start the frontend in a second terminal; this Mac's documented local port is 3002:

```sh
npm run dev -- --port 3002
```

Check the API with `curl http://localhost:5001/api/health`. Do not run the seed command for QA; use the isolated test database configured by the backend workflow tests.

## Production build and start

Set the production environment variables in the hosting platform before building. In particular, `NEXT_PUBLIC_API_URL` must be correct at frontend build time.

```sh
cd backend
npm ci
npm run build
npm start
```

In a separate frontend build job:

```sh
npm ci
npm run lint
npx tsc --noEmit
npm run build
npm start -- --port "$PORT"
```

The backend uses Helmet, rate-limits login, accepts only its configured CORS origins, and returns generic internal error responses. In `NODE_ENV=production`, localhost origins are not added automatically. Set `FRONTEND_URL` and `FRONTEND_URLS` to the exact deployed origins.

## Authentication and transport limits

The current client stores an eight-hour bearer JWT in `sessionStorage` and sends it in the `Authorization` header. Logout clears the token in the browser; the backend logout endpoint is stateless and does not revoke a token already copied elsewhere. The backend does not issue or validate HTTP-only cookies. Axios enables credentialed CORS compatibility, but the current application authenticates with bearer tokens. Use HTTPS in deployment and complete an XSS/CSP security review before handling real employee data; session storage is accessible to same-origin JavaScript.

## Database indexes

Schema indexes are not created automatically when the backend starts in production. No production migration or index build has been run. Before rollout:

1. Back up the database and inspect existing indexes with `db.<collection>.getIndexes()`.
2. Check for duplicate values before building any unique index. Do not drop or deduplicate user data as an automatic migration step.
3. Compare the Mongoose schema indexes in `backend/src/models/index.ts` with the deployed indexes, then schedule creation of only missing indexes.
4. Use `Model.createIndexes()` or explicit MongoDB `createIndex()` commands in a reviewed migration. These create declared/missing indexes without the drop behavior of `syncIndexes()`; do not use `syncIndexes()` as an unattended production startup operation.

For example, the Phase 3 training end-date index can be created idempotently after checking the existing `trainings` indexes:

```sh
mongosh "$MONGODB_URI" --eval 'db.trainings.createIndex({ endDate: 1 })'
```

The deployment operator must also review the other non-unique indexes in the schemas and apply those missing from the target database. Run explain plans against representative data after rollout. The example above is documentation only and was not executed during QA.
