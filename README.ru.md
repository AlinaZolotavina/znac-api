# ZNAC API

[English version](README.md)

Express REST API для ZNAC, персонального сайта, который объединяет портфолио, блог, проекты, фотогалерею и административную панель.

Live API доступен через основной домен:

```text
https://znac.org/api
```

## Связанные Репозитории

- Инфраструктура и деплой: https://github.com/AlinaZolotavina/znac-project
- Frontend: https://github.com/AlinaZolotavina/znac

## Ответственность

- Предоставлять REST endpoints для frontend data и administration flows.
- Аутентифицировать пользователей через JWT, который хранится в cookies.
- Валидировать requests и uploaded files.
- Хранить контент в MongoDB через Mongoose models.
- Раздавать uploaded files через backend и Nginx proxy.
- Запускать backend CI и триггерить production-деплой после успешных проверок.

## Возможности

- Authentication, logout, profile, password recovery и email update.
- Public content endpoints для posts, projects, photos, hashtags и contact form.
- Protected administration endpoints для создания, обновления и удаления контента.
- Upload фотографий и изображений для постов.
- Rate limiting для sensitive и public-write endpoints.
- CORS и Origin validation.
- Централизованная обработка ошибок.
- Request и error logging.
- Health и readiness endpoints.

## Архитектура

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

## Структура Репозитория

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

## Окружение

Создать локальный environment file из примера:

```bash
cp .env.example .env
```

Production Docker deployment использует:

```text
.env.docker
```

Этот файл должен оставаться на сервере и не должен попадать в git.

Важные переменные:

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

## Разработка

Требования:

- Node.js 22+
- MongoDB 8+ для локальной разработки

Установить зависимости:

```bash
npm install
```

Запустить development server:

```bash
npm run dev
```

Запустить production server локально:

```bash
npm start
```

## Тестирование

Запустить lint:

```bash
npm run lint -- .
```

Запустить тесты:

```bash
npm test
```

Запустить тесты в watch mode:

```bash
npm run test:watch
```

Тесты используют Jest, Supertest и MongoDB Memory Server.

## Docker

API имеет собственный Dockerfile и работает как сервис `backend` в `znac-project/docker-compose.yml`.

Запустить полный production-like stack из `znac-project`:

```bash
docker compose up -d --build
```

Backend доступен только внутри Docker network и вызывается через Nginx:

```text
https://znac.org/api/*
```

## CI/CD

GitHub Actions workflow:

```text
.github/workflows/ci.yml
```

На push или pull request в `main` CI выполняет:

```text
npm ci
npm run lint -- .
npm test
```

После успешного push в `main` workflow триггерит production-деплой в `znac-project`.

Deploy flow:

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

GitHub secret, необходимый в этом репозитории:

```text
ZNAC_PROJECT_DEPLOY_TOKEN
```

## Health Checks

```text
GET /health
GET /ready
```

## Операционные Процедуры

Создать MongoDB backup:

```bash
mongodump --uri="$DB_URL" --out ./backup
```

Восстановить MongoDB backup:

```bash
mongorestore --uri="$DB_URL" ./backup
```

Rollback на сервере:

```bash
git checkout <commit>
docker compose up -d --build
```

Для полного production rollback нужно выполнять команды из `/home/ubuntu/znac-project` и checkout нужных commits в затронутых репозиториях.

## Будущие Улучшения

- Миграция на TypeScript.
- Генерация API documentation.
- Cursor pagination, когда объем контента потребует этого.
- Cloud object storage для uploaded files.
- Scheduled database backups.
