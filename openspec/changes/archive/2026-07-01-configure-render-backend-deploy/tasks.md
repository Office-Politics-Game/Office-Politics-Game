## 1. Endpoint configuration

- [x] 1.1 Implement the `Configurable backend endpoints` HTTP behavior in `src/services/apiClient.js`: use `import.meta.env.VITE_API_BASE_URL` when it is defined, and fall back to `/api` when it is undefined or empty; verify with `node tests\deployment-endpoints.test.mjs`.
- [x] 1.2 Implement the Socket.IO endpoint behavior in `src/services/socketClient.js`: use `import.meta.env.VITE_SOCKET_URL` when it is defined, and fall back to `/` when it is undefined or empty; verify with `node tests\deployment-endpoints.test.mjs`.
- [x] 1.3 Preserve the existing local development flow: do not remove the `/api` and `/socket.io` proxy entries from `vite.config.js`, and do not change backend API routes or Socket.IO event contracts in `server/src/app.js` or `server/src/socket/index.js`; verify by source review.

## 2. Documentation and verification

- [x] 2.1 Add `tests/deployment-endpoints.test.mjs` to assert the API client and Socket.IO client read `VITE_API_BASE_URL` and `VITE_SOCKET_URL` when set and preserve `/api` and `/` fallback values when unset.
- [x] 2.2 Update `README.md` deployment notes to record that Vercel should set `VITE_API_BASE_URL` and `VITE_SOCKET_URL`, Render should set `CORS_ORIGIN` and `DATABASE_URL`, and local development still runs without these frontend endpoint variables.
- [x] 2.3 Run `npm.cmd run build` and confirm the production build succeeds without local `VITE_API_BASE_URL` or `VITE_SOCKET_URL` values.
