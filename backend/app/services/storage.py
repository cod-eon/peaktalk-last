import uuid
from functools import lru_cache

from supabase import Client, create_client

from app.config import settings

LARGE_FILE_THRESHOLD_BYTES = 10 * 1024 * 1024  # 10 MB


@lru_cache
def get_supabase_client() -> Client:
    return create_client(settings.supabase_url, settings.supabase_key)


def build_storage_path(user_id: uuid.UUID, document_id: uuid.UUID, filename: str) -> str:
    return f"{user_id}/{document_id}/{filename}"


def upload_file(file_bytes: bytes, storage_path: str, content_type: str) -> str:
    client = get_supabase_client()
    client.storage.from_(settings.supabase_storage_bucket).upload(
        path=storage_path,
        file=file_bytes,
        file_options={"content-type": content_type, "upsert": "false"},
    )
    return storage_path


def delete_file(storage_path: str) -> None:
    client = get_supabase_client()
    client.storage.from_(settings.supabase_storage_bucket).remove([storage_path])


def download_file(storage_path: str) -> bytes:
    client = get_supabase_client()
    return client.storage.from_(settings.supabase_storage_bucket).download(storage_path)


def is_large_file(file_bytes: bytes) -> bool:
    return len(file_bytes) >= LARGE_FILE_THRESHOLD_BYTES
