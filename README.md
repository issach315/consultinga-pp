# Consulting Service

Monorepo for the Consulting SaaS application:

- `consulting-api` - FastAPI backend
- `consulting-ui` - React, TypeScript, and Vite frontend
- `docker-compose.yml` - local API, UI, Redis, and MinIO services

## Prerequisites

Install the following before starting:

- [Git](https://git-scm.com/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- MySQL 8 running on `localhost:3306`

The Docker workflow is recommended. MySQL runs on the host machine and is not
included in Docker Compose.

## Clone and run with Docker

### 1. Clone the repository

```bash
git clone https://github.com/issach315/consultinga-pp.git
cd consultinga-pp
```

### 2. Create the local environment files

macOS/Linux:

```bash
cp consulting-api/.env.example consulting-api/.env
cp consulting-ui/.env.example consulting-ui/.env
```

Windows PowerShell:

```powershell
Copy-Item consulting-api/.env.example consulting-api/.env
Copy-Item consulting-ui/.env.example consulting-ui/.env
```

The `.env` files are ignored by Git. Never commit passwords or production
credentials.

For local development, update at least these values in
`consulting-api/.env`:

```dotenv
DATABASE_URL=mysql+pymysql://root:YOUR_MYSQL_PASSWORD@host.docker.internal:3306/consulting_db
JWT_SECRET_KEY=replace-with-a-long-random-secret
```

Keep `DEBUG=true`; valid values are `true` or `false`.

### 3. Create the MySQL database

Sign in to MySQL and create the development database:

```sql
CREATE DATABASE consulting_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

The MySQL user in `DATABASE_URL` must have permission to use this database.

### 4. Start the application

From the repository root, run:

```bash
docker compose up -d --build
```

Wait for the containers to start, then apply the database migrations:

```bash
docker compose exec api uv run alembic upgrade head
```

### 5. Open the application

| Service | URL |
| --- | --- |
| Web application | http://localhost:5173 |
| API | http://localhost:8000 |
| Swagger API documentation | http://localhost:8000/docs |
| ReDoc API documentation | http://localhost:8000/redoc |
| Health check | http://localhost:8000/health |
| MinIO API | http://localhost:9000 |
| MinIO console | http://localhost:9001 |

Default development MinIO credentials come from `consulting-api/.env`.

## Useful Docker commands

View container status:

```bash
docker compose ps
```

Follow application logs:

```bash
docker compose logs -f api
docker compose logs -f ui
```

Run backend tests:

```bash
docker compose exec api uv run pytest
```

Rebuild after changing dependencies or a Dockerfile:

```bash
docker compose up -d --build
```

Stop the services:

```bash
docker compose down
```

Stop the services and delete local Redis and MinIO data:

```bash
docker compose down -v
```

## Run without Docker

For native development, install these additional tools:

- Python 3.13
- [uv](https://docs.astral.sh/uv/)
- Node.js 22 and npm
- Locally running MySQL and Redis instances

Copy both example environment files as described above. In
`consulting-api/.env`, change the service hostnames to local addresses:

```dotenv
DATABASE_URL=mysql+pymysql://root:YOUR_MYSQL_PASSWORD@localhost:3306/consulting_db
REDIS_URL=redis://localhost:6379/0
MINIO_ENDPOINT=http://localhost:9000
```

Start the backend in one terminal:

```bash
cd consulting-api
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload
```

Start the frontend in another terminal:

```bash
cd consulting-ui
npm install
npm run dev
```

## Email configuration

Invitation emails require an SMTP provider. Configure the `MAIL_*` variables
in `consulting-api/.env`. For Gmail, use a Google App Password rather than your
normal account password. Email-related actions will not deliver messages until
valid SMTP credentials are configured.

## Troubleshooting

- If the API cannot connect to MySQL, confirm MySQL is running on port `3306`,
  the database exists, and the username/password in `DATABASE_URL` are correct.
- When the API runs in Docker, use `host.docker.internal` for the MySQL host.
  When it runs directly on your machine, use `localhost`.
- If port `5173`, `8000`, `6379`, `9000`, or `9001` is already in use, stop the
  conflicting service or change the corresponding port mapping.
- Check startup errors with `docker compose logs -f api` or
  `docker compose logs -f ui`.
