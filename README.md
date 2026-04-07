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

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USERNAME`
- `DB_PASSWORD`
- `JWT_SECRET`
- `JWT_EXPIRATION`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `FRONTEND_URL`
- `CORS_ALLOWED_ORIGINS`
- `PRONUNCIATION_STORAGE_DIR`

### Frontend

- `VITE_API_BASE_URL`
- `VITE_GOOGLE_AUTH_URL`
- `VITE_DEV_PROXY_TARGET`

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
