# StaffSync

StaffSync is the preserved Next.js 15 HRMS frontend with an Express, TypeScript and MongoDB/Mongoose API.

## Prerequisites

Node.js 20+, npm, Homebrew MongoDB Community Edition 8.0 on macOS (or a compatible MongoDB server).

## Local development setup

The local frontend and backend settings live in ignored .env.local and backend/.env files. Use backend/.env.example as the template; set MONGODB_URI=mongodb://127.0.0.1:27017/staffsync, PORT=5001, FRONTEND_URL=http://localhost:3002, and a private DEMO_PASSWORD (at least 12 characters). Keep JWT_SECRET private and at least 32 characters. Set the frontend .env.local values to NEXT_PUBLIC_API_URL=http://localhost:5001/api and NEXT_PUBLIC_ENABLE_DEMO_FALLBACK=false.

To create local configuration files on a new checkout, copy `.env.example` to `.env.local` and `backend/.env.example` to `backend/.env`, then fill in private values locally. Never paste secrets into source files or commit the ignored env files.

### Start MongoDB

```sh
brew services start mongodb-community@8.0
mongosh 'mongodb://127.0.0.1:27017/staffsync' --quiet --eval 'db.adminCommand({ping:1})'
```

### Install and seed

```sh
npm install
cd backend && npm install
npm run seed
```

The seed script is limited to NODE_ENV=development and the local staffsync database. It upserts named demo records; it does not drop collections or delete existing records. It updates the four demo account password hashes from DEMO_PASSWORD each time it runs.

### Start the API and frontend

Start each development server in its own terminal and leave both commands running while using the app. Closing the backend terminal stops the API process; start it again if `/api/health` is no longer reachable. If `NEXT_PUBLIC_API_URL` changes, restart the frontend so Next.js reloads the public environment setting.

In the first terminal:

```sh
cd backend && npm run dev
```

In a second terminal (the local setup uses port 3002 because port 3000 is occupied on this Mac):

```sh
npm run dev -- --port 3002
```

Then open http://localhost:3002. Log in using one of these demo email addresses and the local DEMO_PASSWORD from backend/.env:

- hr@staffsync.demo
- manager@staffsync.demo
- employee@staffsync.demo
- employee2@staffsync.demo

Never commit .env.local or backend/.env. The login page does not prefill a password. Public registration only creates employee-role accounts; HR can create manager and HR accounts through employee administration.

## Checks

From the frontend root: npm test, npm run lint, npx tsc --noEmit, npm run build. From backend/: npm test, npm run build. API health: curl http://localhost:5001/api/health.

## Architecture and API

The existing frontend is under src/; the API is under backend/src/ with routes, authentication, Mongoose models, seed and tests. See docs/frontend-audit.md, docs/integration-map.md, docs/api-contract.md, docs/database-schema.md, and docs/role-permissions.md.

## Deployment and final QA

See [docs/deployment.md](docs/deployment.md) for production environment variables, strict CORS setup, secure startup commands, token-storage limitations, and a controlled index rollout procedure. See [docs/phase4-qa.md](docs/phase4-qa.md) for the role-workflow evidence, responsive checks, and the remaining manual browser checklist. No public deployment has been performed.

## Current limits

Automated tests exercise persisted API workflows using an isolated temporary MongoDB database. The four demo accounts were rechecked through the local HTTP API; authenticated dashboard and mutation workflows were not repeated in a real browser during Phase 4. Leave balance policy remains a fixed development rule, dashboard attendance metrics use available attendance records, and deployment configuration still requires an operator to supply production secrets and apply indexes. Team scope is enforced on manager employee, attendance, leave, decision and report paths. Session authentication uses a short-lived bearer JWT in sessionStorage; logout clears it client-side, and token expiry is handled by redirecting to login.
