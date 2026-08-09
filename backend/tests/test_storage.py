import uuid

import pytest

from app.services import storage


def test_build_storage_path_sanitizes_filename() -> None:
    user_id = uuid.uuid4()
    document_id = uuid.uuid4()

    path = storage.build_storage_path(user_id, document_id, "../../private\\draft финал?.pdf")

    assert path == f"{user_id}/{document_id}/draft_.pdf"


class _NotFound(Exception):
    response = {"Error": {"Code": "404"}}


class _Body:
    def read(self) -> bytes:
        return b"document bytes"


class _FakeYandexClient:
    def __init__(self) -> None:
        self.put_calls: list[dict] = []

    def head_object(self, **_kwargs):
        raise _NotFound()

    def put_object(self, **kwargs):
        self.put_calls.append(kwargs)

    def get_object(self, **_kwargs):
        return {"Body": _Body()}

    def delete_object(self, **_kwargs):
        return None

    def generate_presigned_url(self, *_args, **_kwargs) -> str:
        return "https://storage.example/signed"


@pytest.mark.asyncio
async def test_yandex_storage_upload_download_delete_and_signed_url(monkeypatch) -> None:
    fake = _FakeYandexClient()
    monkeypatch.setattr(storage.settings, "storage_provider", "yandex")
    monkeypatch.setattr(storage.settings, "yandex_s3_bucket", "private-bucket")
    monkeypatch.setattr(storage.settings, "yandex_s3_kms_key_id", "kms-key")
    monkeypatch.setattr(storage, "_get_yandex_client", lambda: fake)

    object_key = "user/document/file.txt"
    assert await storage.upload_file(b"document bytes", object_key, "text/plain") == object_key
    assert fake.put_calls[0]["ServerSideEncryption"] == "aws:kms"
    assert fake.put_calls[0]["SSEKMSKeyId"] == "kms-key"
    assert fake.put_calls[0]["Metadata"]["sha256"]
    assert await storage.download_file(object_key) == b"document bytes"
    assert storage.create_download_url(object_key) == "https://storage.example/signed"
    await storage.delete_file(object_key)
