import io
import uuid
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient


def _make_txt_bytes(content: str = "Hello, this is a test speech document.") -> bytes:
    return content.encode("utf-8")


@pytest.fixture(autouse=True)
def mock_storage(monkeypatch):
    """Mock all Supabase Storage calls (now async) so tests don't need real credentials."""
    monkeypatch.setattr(
        "app.routers.documents.storage.upload_file",
        AsyncMock(side_effect=lambda file_bytes, path, ct: path),
    )
    monkeypatch.setattr(
        "app.routers.documents.storage.delete_file",
        AsyncMock(return_value=None),
    )
    monkeypatch.setattr("app.routers.documents.storage.is_large_file", lambda b: False)
    monkeypatch.setattr(
        "app.routers.documents.storage.build_storage_path",
        lambda user_id, doc_id, name: f"{user_id}/{doc_id}/{name}",
    )


@pytest.mark.asyncio
async def test_upload_txt_document(client: AsyncClient) -> None:
    file_bytes = _make_txt_bytes("My presentation about AI.")
    response = await client.post(
        "/documents/upload",
        files={"file": ("speech.txt", io.BytesIO(file_bytes), "text/plain")},
        data={"file_type": "speech"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "speech.txt"
    assert data["file_type"] == "speech"
    assert data["extracted_text"] == "My presentation about AI."
    assert data["parsed_at"] is not None


@pytest.mark.asyncio
async def test_upload_unsupported_type(client: AsyncClient) -> None:
    response = await client.post(
        "/documents/upload",
        files={"file": ("script.exe", io.BytesIO(b"MZ..."), "application/x-msdownload")},
    )
    assert response.status_code == 415


@pytest.mark.asyncio
async def test_list_documents_empty(client: AsyncClient) -> None:
    response = await client.get("/documents")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_upload_and_list(client: AsyncClient) -> None:
    file_bytes = _make_txt_bytes("Investor pitch deck content.")
    await client.post(
        "/documents/upload",
        files={"file": ("pitch.txt", io.BytesIO(file_bytes), "text/plain")},
        data={"file_type": "pitch"},
    )

    response = await client.get("/documents")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    names = [d["name"] for d in data["items"]]
    assert "pitch.txt" in names


@pytest.mark.asyncio
async def test_delete_document(client: AsyncClient) -> None:
    file_bytes = _make_txt_bytes("Temporary document.")
    upload_resp = await client.post(
        "/documents/upload",
        files={"file": ("temp.txt", io.BytesIO(file_bytes), "text/plain")},
    )
    assert upload_resp.status_code == 201
    doc_id = upload_resp.json()["id"]

    delete_resp = await client.delete(f"/documents/{doc_id}")
    assert delete_resp.status_code == 204

    list_resp = await client.get("/documents")
    ids = [d["id"] for d in list_resp.json()["items"]]
    assert doc_id not in ids


@pytest.mark.asyncio
async def test_delete_nonexistent_document(client: AsyncClient) -> None:
    response = await client.delete(f"/documents/{uuid.uuid4()}")
    assert response.status_code == 404
