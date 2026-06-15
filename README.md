# ZNAC API

Backend API for ZNAC, a personal website that combines a portfolio, blog, photo gallery, and administration dashboard.

The API provides authentication, content management, and administration features for the ZNAC platform.

Developed independently, including API design, database modeling, authentication, deployment, and server maintenance.

## Related Repository

Frontend application: https://github.com/AlinaZolotavina/znac

## Features

**Authentication & Authorization**

- User authentication using JWT
- Protected routes
- Password hashing with bcrypt
- Password recovery functionality
- Profile management

**Content Management**

- Create, update, and delete blog posts
- Create, update, and delete projects
- Upload and manage photos
- Manage hashtags and categories

**Security**

- Request validation
- Rate limiting
- Secure HTTP headers
- CORS configuration
- Centralized error handling

**Monitoring & Logging**

- Request logging
- Error logging
- Process management with PM2

## Technologies

**_Backend:_** Node.js, Express.js, REST API

**_Database:_** MongoDB, Mongoose

**_Authentication & Security:_** JSON Web Token (JWT), bcryptjs, helmet, cors, express-rate-limit

**_Validation:_** Joi, celebrate, validator

**_Monitoring & Logging:_** Winston, express-winston, PM2

**_Development Tools:_** ESLint, nodemon, dotenv

## Requirements

- Node.js 22.x
- MongoDB 8+

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

## Running the Application

Start in development mode:

```bash
npm run dev
```

Start in production mode:

```bash
npm start
```

## Health Checks

```text
GET /health
GET /ready
```

## Deployment

The API is deployed on AWS Lightsail and runs behind Nginx.

Deployment setup includes:

- PM2 process management
- Reverse proxy with Nginx
- Environment-based configuration
- SSL-secured communication

## PM2

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

## Backup Procedure

Create a MongoDB backup:

```bash
mongodump --uri="$DB_URL" --out ./backup
```

The command creates a backup of all MongoDB collections in the `backup` directory.

It is recommended to create backups before major releases and database migrations.

## Restore Procedure

Restore the database from a backup:

```bash
mongorestore --uri="$DB_URL" ./backup
```

This command restores the database from a previously created backup.

Always test restoration on a staging environment before restoring production data.

## Rollback Procedure

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
- Automated testing
- Performance optimization
