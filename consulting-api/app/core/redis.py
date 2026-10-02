from collections.abc import AsyncGenerator
from functools import lru_cache

from redis.asyncio import Redis

from app.core.config import get_settings

settings = get_settings()


@lru_cache
def get_redis_pool() -> Redis:
    """Lazily-created, process-wide async Redis client.

    Not required for basic login. Reserved for future caching, rate
    limiting, session support, and distributed locks.
    """
    return Redis.from_url(settings.redis_url, encoding="utf-8", decode_responses=True)


async def get_redis() -> AsyncGenerator[Redis]:
    yield get_redis_pool()


async def ping_redis() -> bool:
    try:
        return await get_redis_pool().ping()
    except Exception:
        return False
