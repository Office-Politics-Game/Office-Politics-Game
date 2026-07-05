## Why

The frontend is deployed on Vercel and the backend will be deployed on Render. In production, the frontend cannot rely on the local Vite proxy relative paths. The frontend needs configurable backend endpoints for Render while preserving the existing local-development fallback behavior when no environment variables are set.

## What Changes

- HTTP API client supports `VITE_API_BASE_URL`; when unset, it still falls back to `/api`.
- Socket.IO client supports `VITE_SOCKET_URL`; when unset, it still falls back to `/`.
- Local `npm run dev` with Vite proxy and `server npm run dev` remains supported without requiring Vite endpoint variables.
- Deployment documentation records the minimum Vercel and Render environment variables needed for this setup.

## Non-Goals

- Do not change backend routes, Socket.IO events, game logic, or database schema.
- Do not add Vercel rewrites as the primary deployment approach.
- Do not change the Render backend start command; `server/package.json` remains the backend entry point.
- Do not commit production secrets or `DATABASE_URL` values.
- Do not remove the fallback behavior for local development.

## Capabilities

### New Capabilities

- `deployment-backend-endpoints`: Frontend clients can use production backend endpoints from Vite environment variables while preserving local fallback endpoints.

### Modified Capabilities

(none)

## Impact

- Affected specs: deployment-backend-endpoints
- Affected code:
  - New: tests/deployment-endpoints.test.mjs
  - Modified: src/services/apiClient.js
  - Modified: src/services/socketClient.js
  - Modified: README.md
  - Removed: (none)
