# consulting-service

- `consulting-api` — FastAPI backend (Phase 1: JWT authentication)
- `consulting-ui` — React frontend

Docker Compose runs both, plus MySQL, Redis, MinIO, and Mailpit. All commands
below run from this directory.

## Prerequisites

MySQL runs on the host, not in Compose. Have a MySQL server reachable at
`localhost:3306` with a database already created, and set `DATABASE_URL` in
`consulting-api/.env` accordingly (the api container reaches the host via
`host.docker.internal`).

## Commands

Start everything:

```bash
docker compose up -d
```

Rebuild after changing a Dockerfile or dependency file:

```bash
docker compose up -d --build
```

View logs:

```bash
docker compose logs -f api
docker compose logs -f ui
```

Stop:

```bash
docker compose down
```

Stop and remove volumes (Redis/MinIO data):

```bash
docker compose down -v
```

Run migrations:

```bash
docker compose exec api uv run alembic upgrade head
```

Run backend tests:

```bash
docker compose exec api uv run pytest
```

## URLs

| Service | URL |
| --- | --- |
| UI | http://localhost:5173 |
| API | http://localhost:8000 |
| Swagger | http://localhost:8000/docs |
| ReDoc | http://localhost:8000/redoc |
| Health | http://localhost:8000/health |
| MySQL | localhost:3306 (host) |
| Redis | localhost:6379 |
| MinIO API | http://localhost:9000 |
| MinIO Console | http://localhost:9001 |
| Mailpit | http://localhost:8025 |
| Mailpit SMTP | localhost:1025 |
