# ZNAC API

Backend API for ZNAC, a personal website that combines a portfolio, blog, photo gallery, and administration dashboard.

The API provides authentication, content management, and administration features for the ZNAC platform.

Developed independently, including API design, database modeling, authentication, deployment, and server maintenance.

## Related Repository

Frontend application: [ZNAC](https://github.com/AlinaZolotavina/znac)

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

## Deployment

The API is deployed on AWS Lightsail and runs behind Nginx.

Deployment setup includes:

- PM2 process management
- Reverse proxy with Nginx
- Environment-based configuration
- SSL-secured communication

## Future Improvements

- Migration to TypeScript
- Automated testing
- Performance optimization
