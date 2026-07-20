# ZNAC API

REST API for ZNAC, a personal website that combines a portfolio, blog, projects showcase, photo gallery, and administration dashboard.

The backend was designed and developed independently, including API architecture, database modeling, authentication, security, deployment, automated testing, and server maintenance.

This project is actively maintained and continuously improved.

## Related Repository

Frontend application: https://github.com/AlinaZolotavina/znac

## Features

**Authentication & Authorization**

- User authentication using JWT
- Protected routes
- Password hashing with bcrypt
- Password recovery functionality
- Profile management (email and password change)

**Content Management**

- Create, update, and delete blog posts
- Create, update, and delete projects
- Upload and manage photos
- Manage hashtags

**Security**

- Request validation
- Rate limiting
- Secure HTTP headers
- CORS configuration
- Centralized error handling
- File type validation
- Environment configuration validation

**Monitoring & Logging**

- Request logging
- Error logging
- Health check endpoints
- Process management with PM2

## Architecture

```
Browser
    │
    ▼
 Nginx
    │
    ▼
 Express API
    │
    ▼
    MongoDB (external)
```

## Technologies

**_Backend:_** Node.js, Express.js, REST API

**_Database:_** MongoDB, Mongoose

**_Authentication & Security:_** JSON Web Token (JWT), bcryptjs, helmet, cors, express-rate-limit

**_Validation:_** Joi, celebrate, validator

**_File Upload:_** Multer, file-type

**_Monitoring & Logging:_** Winston, express-winston, PM2

**_Testing:_** Jest, Supertest, MongoDB Memory Server

**_Development:_** Docker, Docker Compose, dotenv, ESLint, nodemon

## Requirements

For local development:

- Node.js 22+
- MongoDB 8+

When running the complete application through Docker Compose, these dependencies are provided by the containerized environment (except MongoDB if it runs externally).

## Installation

Clone the repository:

```bash
git clone https://github.com/AlinaZolotavina/znac-api.git
cd znac-api
```

Install dependencies:

```bash
npm install
```

Create an environment file:

```bash
cp .env.example .env
```

Fill in the required environment variables before starting the application.

## Running

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

Run tests:

```bash
npm test
```

## Docker

The API is designed to run as part of the complete Docker Compose stack.

From the root project directory:

```bash
docker compose up --build
```

The API is exposed internally and is accessed through the Nginx reverse proxy.

## Deployment

The production deployment uses:

- Docker
- Nginx as a reverse proxy
- PM2 process management
- MongoDB
- Environment-based configuration
- SSL
- Health checks

## Health Checks

Health endpoints are used by deployment infrastructure and monitoring systems to verify application availability and readiness.

```text
GET /health
GET /ready
```

## PM2

PM2 is used only for production deployment on the server.

Start application:

```bash
pm2 start ecosystem.config.js
```

Restart application:

```bash
pm2 restart app
```

Save PM2 configuration:

```bash
pm2 save
```

## Operational Procedures

### Backup

Create a MongoDB backup:

```bash
mongodump --uri="$DB_URL" --out ./backup
```

The command creates a backup of all MongoDB collections in the `backup` directory.

It is recommended to create backups before major releases and database migrations.

### Restore

Restore the database from a backup:

```bash
mongorestore --uri="$DB_URL" ./backup
```

This command restores the database from a previously created backup.

Always test restoration on a staging environment before restoring production data.

### Rollback

If a deployment fails:

1. Connect to the server.
2. Checkout the previous stable commit:

```bash
git checkout <commit-hash>
```

3. Install dependencies:

```bash
npm install
```

4. Restart the application:

```bash
pm2 restart app
```

5. Verify application health:

```bash
curl https://api.znac.org/health
curl https://api.znac.org/ready
```

## Future Improvements

- Migration to TypeScript
- Migration to cursor pagination when required
- Cloud object storage for uploaded files
- API documentation generation
