# consulting-api

FastAPI backend for the Consulting SaaS platform. Phase 1 scope: JWT authentication
(login, refresh rotation, logout, current user) with multi-role users, backed by
MySQL, Redis, MinIO, and Mailpit.

Docker Compose lives at the repo root (`../docker-compose.yml`), alongside `consulting-ui`.
See [`../README.md`](../README.md) for Docker commands and service URLs.

## Local development (without Docker)

```bash
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload
uv run pytest
```
