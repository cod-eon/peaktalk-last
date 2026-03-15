import asyncio
import uuid
from functools import lru_cache

from supabase import Client, create_client

from app.config import settings

LARGE_FILE_THRESHOLD_BYTES = 10 * 1024 * 1024  # 10 MB


@lru_cache
def _get_supabase_client() -> Client:
    return create_client(settings.supabase_url, settings.supabase_key)


def build_storage_path(user_id: uuid.UUID, document_id: uuid.UUID, filename: str) -> str:
    return f"{user_id}/{document_id}/{filename}"


async def upload_file(file_bytes: bytes, storage_path: str, content_type: str) -> str:
    def _do_upload() -> str:
        _get_supabase_client().storage.from_(settings.supabase_storage_bucket).upload(
            path=storage_path,
            file=file_bytes,
            file_options={"content-type": content_type, "upsert": "false"},
        )
        return storage_path

    return await asyncio.to_thread(_do_upload)


async def delete_file(storage_path: str) -> None:
    def _do_delete() -> None:
        _get_supabase_client().storage.from_(settings.supabase_storage_bucket).remove([storage_path])

    await asyncio.to_thread(_do_delete)


async def download_file(storage_path: str) -> bytes:
    def _do_download() -> bytes:
        return _get_supabase_client().storage.from_(settings.supabase_storage_bucket).download(storage_path)

    return await asyncio.to_thread(_do_download)


def is_large_file(file_bytes: bytes) -> bool:
    return len(file_bytes) >= LARGE_FILE_THRESHOLD_BYTES
