# ZNAC API

[Russian version](README.ru.md)

Express REST API for ZNAC, a personal website that combines a portfolio, blog, projects showcase, photo gallery, and administration dashboard.

Live API is served through the main domain:

```text
https://znac.org/api
```

## Related Repositories

- Infrastructure and deployment: https://github.com/AlinaZolotavina/znac-project
- Frontend: https://github.com/AlinaZolotavina/znac

## Responsibilities

- Provide REST endpoints for frontend data and administration flows.
- Authenticate users with JWT stored in cookies.
- Validate requests and uploaded files.
- Store content in MongoDB through Mongoose models.
- Serve uploaded files through the backend and Nginx proxy.
- Run backend CI and trigger production deployment after successful checks.

## Features

- Authentication, logout, profile, password recovery, and email update.
- Public content endpoints for posts, projects, photos, hashtags, and contact form.
- Protected administration endpoints for creating, updating, and deleting content.
- Photo and post image upload.
- Rate limiting for sensitive and public-write endpoints.
- CORS and Origin validation.
- Centralized error handling.
- Request and error logging.
- Health and readiness endpoints.

## Architecture

```text
Express app
  |
  v
Routes
  |-- public content routes
  |-- auth routes
  |-- protected admin routes
  |
  v
Controllers
  |
  v
Services / utilities
  |
  v
Mongoose models
  |
  v
MongoDB on AWS host
```

Production architecture:

```text
Browser
  |
  v
Nginx container from znac-project
  |
  v
Express backend container
  |
  v
MongoDB on host through host.docker.internal
```

## Repository Layout

```text
znac-api/
  .github/workflows/ci.yml
  controllers/
  errors/
  middlewares/
  models/
  routes/
  services/
  tests/
  utils/
  Dockerfile
  server.js
  app.js
```

## Environment

Create a local environment file from the example:

```bash
cp .env.example .env
```

Production Docker deployment uses:

```text
.env.docker
```

This file must stay on the server and must not be committed.

Important variables:

```text
PORT
DB_URL
CLIENT_URL
API_URL
JWT_SECRET
JWT_RESET_PASSWORD
JWT_UPDATE_EMAIL
NODEMAILER_HOST
NODEMAILER_USER
NODEMAILER_PASSWORD
CONTACT_FORM_TO_EMAIL
```

## Development

Requirements:

- Node.js 22+
- MongoDB 8+ for local development

Install dependencies:

```bash
npm install
```

Start development server:

```bash
npm run dev
```

Start production server locally:

```bash
npm start
```

## Testing

Run lint:

```bash
npm run lint -- .
```

Run tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Tests use Jest, Supertest, and MongoDB Memory Server.

## Docker

The API has its own Dockerfile and runs as the `backend` service in `znac-project/docker-compose.yml`.

Run the full production-like stack from `znac-project`:

```bash
docker compose up -d --build
```

The backend is exposed only inside the Docker network and is reached through Nginx:

```text
https://znac.org/api/*
```

## CI/CD

GitHub Actions workflow:

```text
.github/workflows/ci.yml
```

On push or pull request to `main`, CI runs:

```text
npm ci
npm run lint -- .
npm test
```

On successful push to `main`, the workflow triggers production deployment in `znac-project`.

Deployment flow:

```text
Push to znac-api/main
  |
  v
Backend CI
  |
  v
Trigger znac-project Deploy
  |
  v
AWS Lightsail docker compose up -d --build
```

Required GitHub secret in this repository:

```text
ZNAC_PROJECT_DEPLOY_TOKEN
```

## Health Checks

```text
GET /health
GET /ready
```

## Operational Procedures

Create a MongoDB backup:

```bash
mongodump --uri="$DB_URL" --out ./backup
```

Restore a MongoDB backup:

```bash
mongorestore --uri="$DB_URL" ./backup
```

Rollback on the server:

```bash
git checkout <commit>
docker compose up -d --build
```

For full production rollback, run the commands from `/home/ubuntu/znac-project` and check out the required commits in the affected repositories.

## Future Improvements

- Migration to TypeScript.
- API documentation generation.
- Cursor pagination when content volume requires it.
- Cloud object storage for uploaded files.
- Scheduled database backups.
