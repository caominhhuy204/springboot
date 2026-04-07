# LearnEng

## Local run

### Backend

From [backend/english](/D:/OneDrive/Máy%20tính/springboot/backend/english):

```powershell
.\mvnw.cmd spring-boot:run
```

Default local values are already wired in `application.yaml`:

- backend: `http://localhost:8080`
- frontend: `http://localhost:5173`
- mysql: `localhost:3306`
- db: `mydb`
- db user: `root`
- db password: `123456`
- backend port: `PORT` or `8080`

### Frontend

From [frontend](/D:/OneDrive/Máy%20tính/springboot/frontend):

```powershell
npm install
npm run dev
```

Default local frontend URL assumptions:

- frontend app: `http://localhost:5173`
- backend API: `http://localhost:8080`
- Google auth entry: `http://localhost:8080/oauth2/authorization/google`

## Environment variables

The project now supports environment overrides while preserving local defaults.

### Backend

- `PORT`
- `DB_URL`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USERNAME`
- `DB_PASSWORD`
- `DB_USE_SSL`
- `JWT_SECRET`
- `JWT_EXPIRATION`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `FRONTEND_URL`
- `CORS_ALLOWED_ORIGINS`
- `PRONUNCIATION_STORAGE_DIR`
- `APP_COOKIE_SECURE`
- `APP_COOKIE_SAME_SITE`
- `MAIL_HOST`
- `MAIL_PORT`
- `MAIL_USERNAME`
- `MAIL_PASSWORD`

### Frontend

- `VITE_API_BASE_URL`
- `VITE_GOOGLE_AUTH_URL`
- `VITE_DEV_PROXY_TARGET`

For separate frontend/backend deploys, use:

- `FRONTEND_URL=https://your-frontend-domain`
- `CORS_ALLOWED_ORIGINS=https://your-frontend-domain`
- `VITE_API_BASE_URL=https://your-backend-domain`
- `VITE_GOOGLE_AUTH_URL=https://your-backend-domain/oauth2/authorization/google`

## Docker Compose

From the project root:

```powershell
docker compose up -d --build
```

Default compose URLs:

- frontend: `http://localhost:3000`
- backend: `http://localhost:8080`
- mysql: `localhost:3306`

For production-like deploy, put your real values in `.env` based on `.env.example`.

## Notes before public deploy

- The current Google OAuth client id/secret and JWT secret still have local-safe defaults for compatibility.
- Before a real public deploy, rotate those secrets and provide them only through environment variables.
- Pronunciation audio is stored on disk. In Docker, keep the mounted volume so uploads survive restarts.

## Render deploy

- The backend is ready to deploy from [render.yaml](/D:/OneDrive/MĂ¡y%20tĂ­nh/springboot/render.yaml).
- Use the repo root in Render and keep the service root at `backend/english`.
- Health check endpoint: `GET /api/health`
- Required env vars on Render: `DB_URL` or `DB_HOST` + `DB_PORT` + `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS`
- Optional env vars on Render: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `PRONUNCIATION_STORAGE_DIR`
- If frontend is deployed separately, set `FRONTEND_URL` and `CORS_ALLOWED_ORIGINS` to the frontend domain, and set `VITE_API_BASE_URL` to the backend domain.
- If you want Google OAuth on Render, also set `SPRING_PROFILES_ACTIVE=oauth`
- For HTTPS cross-site cookie auth, keep `APP_COOKIE_SECURE=true` and `APP_COOKIE_SAME_SITE=None`
