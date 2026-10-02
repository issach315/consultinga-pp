from datetime import timedelta
from functools import lru_cache
from typing import BinaryIO
from urllib.parse import urlparse

from minio import Minio

from app.core.config import get_settings

settings = get_settings()


class StorageClient:
    """S3-compatible object storage abstraction.

    Backed by MinIO today; swapping to AWS S3 later only requires changing
    the underlying client construction, not the call sites.
    """

    def __init__(self, client: Minio, public_client: Minio, bucket: str) -> None:
        self._client = client
        self._public_client = public_client
        self._bucket = bucket

    def ensure_bucket(self) -> None:
        if not self._client.bucket_exists(self._bucket):
            self._client.make_bucket(self._bucket)

    def upload(self, object_name: str, data: BinaryIO, length: int, content_type: str) -> None:
        self._client.put_object(self._bucket, object_name, data, length, content_type=content_type)

    def download(self, object_name: str):
        return self._client.get_object(self._bucket, object_name)

    def delete(self, object_name: str) -> None:
        self._client.remove_object(self._bucket, object_name)

    def presigned_url(self, object_name: str, expires: timedelta = timedelta(minutes=15)) -> str:
        # Signed against the public client so the URL host is reachable
        # from the browser, not just from other containers.
        return self._public_client.presigned_get_object(self._bucket, object_name, expires=expires)


def _build_minio_client(endpoint_url: str) -> Minio:
    parsed = urlparse(endpoint_url)
    endpoint = parsed.netloc or parsed.path
    return Minio(
        endpoint,
        access_key=settings.minio_access_key,
        secret_key=settings.minio_secret_key,
        region=settings.minio_region,
        secure=settings.minio_secure,
    )


@lru_cache
def get_storage_client() -> StorageClient:
    client = _build_minio_client(settings.minio_endpoint)
    public_client = _build_minio_client(settings.minio_public_endpoint)
    return StorageClient(client, public_client, settings.minio_bucket)


def ping_storage() -> bool:
    try:
        get_storage_client()._client.bucket_exists(settings.minio_bucket)
        return True
    except Exception:
        return False
