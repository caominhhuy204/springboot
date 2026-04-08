# Render deployment notes

## Frontend

- Do not deploy the frontend as a Render `Web Service`.
- Deploy the frontend as a Render `Static Site`.
- The repository already defines that in [`render.yaml`](/D:/OneDrive/Máy tính/springboot/render.yaml): `learneng-frontend` uses `type: web` with `runtime: static`, `buildCommand: npm ci && npm run build`, and `staticPublishPath: dist`.
- A Render `Static Site` does not sleep after inactivity. If your frontend is sleeping now, it was most likely created manually as a `Web Service` in the Render dashboard.
- Fix: delete the current frontend Render service and recreate it as a `Static Site`, or redeploy from the blueprint in `render.yaml`.

## Backend

- The backend is a Render `Web Service` on the free plan.
- Free Render web services can cold start after inactivity.
- That cold start cannot be fully removed on the free plan. The realistic options are:
  - upgrade the backend to a paid plan
  - move the backend to a platform without sleep
  - keep the frontend static and only show a loading state while the backend wakes up

## Required env vars

- Frontend: `VITE_API_BASE_URL`, `VITE_GOOGLE_AUTH_URL`
- Backend: `DB_URL` or `DB_HOST` + `DB_PORT` + `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS`
