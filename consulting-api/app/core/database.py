import secrets
import time
import uuid
from collections.abc import Generator
from datetime import UTC, datetime

from sqlalchemy import DateTime, create_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker

from app.core.config import get_settings

settings = get_settings()

engine = create_engine(settings.database_url, pool_pre_ping=True, future=True)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


class Base(DeclarativeBase):
    pass


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )


def new_uuid() -> str:
    return str(uuid.uuid4())


_CROCKFORD_BASE32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"


def new_ulid() -> str:
    """Generate a 26-character, time-sortable ULID without an extra dependency."""
    value = (int(time.time() * 1000) << 80) | int.from_bytes(secrets.token_bytes(10), "big")
    chars: list[str] = []
    for _ in range(26):
        value, remainder = divmod(value, 32)
        chars.append(_CROCKFORD_BASE32[remainder])
    return "".join(reversed(chars))


def get_db() -> Generator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
