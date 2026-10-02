import logging
import sys

from app.core.config import get_settings

settings = get_settings()


def configure_logging() -> None:
    level = logging.DEBUG if settings.debug else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        stream=sys.stdout,
    )
    # Never log request/response bodies at INFO+ — tokens and passwords pass through here.
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
