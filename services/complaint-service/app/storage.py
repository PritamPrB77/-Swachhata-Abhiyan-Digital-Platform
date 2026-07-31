import uuid
from io import BytesIO

from minio import Minio

from app.config import settings

_client: Minio | None = None


def get_minio() -> Minio:
    global _client
    if _client is None:
        _client = Minio(
            settings.minio_endpoint,
            access_key=settings.minio_access_key,
            secret_key=settings.minio_secret_key,
            secure=settings.minio_secure,
        )
        found = _client.bucket_exists(settings.minio_bucket)
        if not found:
            _client.make_bucket(settings.minio_bucket)
    return _client


def upload_image(file_bytes: bytes, content_type: str, filename: str) -> str:
    client = get_minio()
    ext = filename.split(".")[-1] if "." in filename else "jpg"
    key = f"complaints/{uuid.uuid4().hex}.{ext}"
    client.put_object(
        settings.minio_bucket,
        key,
        BytesIO(file_bytes),
        length=len(file_bytes),
        content_type=content_type or "application/octet-stream",
    )
    return key


def public_url(image_key: str) -> str:
    if not image_key:
        return ""
    return f"{settings.public_media_base}/{settings.minio_bucket}/{image_key}"
