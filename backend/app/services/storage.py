"""Private document storage with a gated legacy/Yandex provider switch."""

import asyncio
import hashlib
import logging
import re
import uuid
from functools import lru_cache

from supabase import Client, create_client

from app.config import settings

logger = logging.getLogger("peaktalk.storage")

LARGE_FILE_THRESHOLD_BYTES = 10 * 1024 * 1024  # 10 MB
_SAFE_FILENAME = re.compile(r"[^A-Za-z0-9._-]+")


class StorageError(RuntimeError):
    """A provider operation failed without exposing provider credentials."""


@lru_cache
def _get_supabase_client() -> Client:
    return create_client(settings.supabase_url, settings.supabase_key)


def _safe_filename(filename: str, document_id: uuid.UUID) -> str:
    basename = filename.replace("\\", "/").rsplit("/", 1)[-1].strip().replace("\x00", "")
    safe = _SAFE_FILENAME.sub("_", basename)[:160].strip("._")
    return safe or f"{document_id}.bin"


def build_storage_path(user_id: uuid.UUID, document_id: uuid.UUID, filename: str) -> str:
    """Build a tenant-scoped key and prevent path traversal from filenames."""

    return f"{user_id}/{document_id}/{_safe_filename(filename, document_id)}"


def _require_yandex_settings() -> None:
    missing = [
        name
        for name, value in (
            ("YANDEX_S3_ACCESS_KEY_ID", settings.yandex_s3_access_key_id),
            ("YANDEX_S3_SECRET_ACCESS_KEY", settings.yandex_s3_secret_access_key),
            ("YANDEX_S3_KMS_KEY_ID", settings.yandex_s3_kms_key_id),
        )
        if not value
    ]
    if missing:
        raise StorageError(f"Yandex storage configuration is incomplete: {', '.join(missing)}")


@lru_cache
def _get_yandex_client():
    _require_yandex_settings()
    # Lazy import keeps the legacy provider and unit tests independent from
    # the migration dependency until the feature flag is opened.
    import boto3
    from botocore.config import Config

    return boto3.client(
        "s3",
        endpoint_url=settings.yandex_s3_endpoint_url,
        region_name=settings.yandex_s3_region,
        aws_access_key_id=settings.yandex_s3_access_key_id,
        aws_secret_access_key=settings.yandex_s3_secret_access_key,
        config=Config(
            signature_version="s3v4",
            retries={"mode": "standard", "max_attempts": settings.yandex_s3_max_attempts},
            connect_timeout=settings.yandex_s3_connect_timeout_seconds,
            read_timeout=settings.yandex_s3_read_timeout_seconds,
            s3={"addressing_style": "path"},
        ),
    )


def _upload_yandex(file_bytes: bytes, storage_path: str, content_type: str) -> str:
    if not content_type or len(content_type) > 255 or any(char in content_type for char in "\r\n"):
        raise StorageError("Invalid object content type")
    client = _get_yandex_client()
    checksum = hashlib.sha256(file_bytes).hexdigest()
    try:
        existing = client.head_object(Bucket=settings.yandex_s3_bucket, Key=storage_path)
    except Exception as exc:
        error_code = str(getattr(exc, "response", {}).get("Error", {}).get("Code", ""))
        if error_code not in {"404", "NoSuchKey", "NotFound"}:
            raise StorageError("Yandex object preflight failed") from exc
    else:
        metadata = {str(k).lower(): str(v) for k, v in (existing.get("Metadata") or {}).items()}
        if metadata.get("sha256") == checksum and existing.get("ContentLength") == len(file_bytes):
            return storage_path
        raise StorageError("Object key already exists with different content")

    try:
        client.put_object(
            Bucket=settings.yandex_s3_bucket,
            Key=storage_path,
            Body=file_bytes,
            ContentType=content_type,
            ContentLength=len(file_bytes),
            Metadata={"sha256": checksum},
            ServerSideEncryption="aws:kms",
            SSEKMSKeyId=settings.yandex_s3_kms_key_id,
        )
    except Exception as exc:
        raise StorageError("Yandex object upload failed") from exc
    return storage_path


def _delete_yandex(storage_path: str) -> None:
    try:
        _get_yandex_client().delete_object(Bucket=settings.yandex_s3_bucket, Key=storage_path)
    except Exception as exc:
        raise StorageError("Yandex object delete failed") from exc


def _download_yandex(storage_path: str) -> bytes:
    try:
        response = _get_yandex_client().get_object(Bucket=settings.yandex_s3_bucket, Key=storage_path)
        return response["Body"].read()
    except Exception as exc:
        raise StorageError("Yandex object download failed") from exc


def create_download_url(storage_path: str) -> str:
    """Create a short-lived signed URL for a private object."""

    if settings.storage_provider == "legacy":
        try:
            return _get_supabase_client().storage.from_(settings.supabase_storage_bucket).create_signed_url(
                storage_path, settings.yandex_s3_presign_ttl_seconds
            )["signedURL"]
        except Exception as exc:
            raise StorageError("Could not create signed download URL") from exc

    try:
        return _get_yandex_client().generate_presigned_url(
            "get_object",
            Params={"Bucket": settings.yandex_s3_bucket, "Key": storage_path},
            ExpiresIn=settings.yandex_s3_presign_ttl_seconds,
        )
    except Exception as exc:
        raise StorageError("Could not create signed download URL") from exc


async def upload_file(file_bytes: bytes, storage_path: str, content_type: str) -> str:
    def _do_upload() -> str:
        if settings.storage_provider == "yandex":
            return _upload_yandex(file_bytes, storage_path, content_type)
        _get_supabase_client().storage.from_(settings.supabase_storage_bucket).upload(
            path=storage_path,
            file=file_bytes,
            file_options={"content-type": content_type, "upsert": "false"},
        )
        return storage_path

    return await asyncio.to_thread(_do_upload)


async def delete_file(storage_path: str) -> None:
    def _do_delete() -> None:
        if settings.storage_provider == "yandex":
            _delete_yandex(storage_path)
            return
        _get_supabase_client().storage.from_(settings.supabase_storage_bucket).remove([storage_path])

    await asyncio.to_thread(_do_delete)


async def download_file(storage_path: str) -> bytes:
    def _do_download() -> bytes:
        if settings.storage_provider == "yandex":
            return _download_yandex(storage_path)
        return _get_supabase_client().storage.from_(settings.supabase_storage_bucket).download(storage_path)

    return await asyncio.to_thread(_do_download)


def is_large_file(file_bytes: bytes) -> bool:
    return len(file_bytes) >= LARGE_FILE_THRESHOLD_BYTES
