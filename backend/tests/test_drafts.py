import uuid

import pytest
from httpx import AsyncClient

from app.services.gemini import GeminiAnalysisResult, GeminiError

MOCK_GEMINI_RESULT = GeminiAnalysisResult(
    improved_text="This is the improved version of the speech.",
    feedback={
        "logic": "Good logical structure with clear sections.",
        "style": "Professional tone, appropriate for business context.",
        "clarity": "Clear and concise, no unnecessary filler.",
        "grammar": "No grammatical errors detected.",
        "overall_score": 8,
    },
)

DRAFT_PAYLOAD = {
    "title": "My investor pitch",
    "raw_text": "We are building an AI coach for public speaking. Our users are students and founders.",
}


@pytest.fixture(autouse=True)
def mock_gemini(monkeypatch):
    monkeypatch.setattr("app.routers.drafts.analyze_draft", lambda text: MOCK_GEMINI_RESULT)


@pytest.mark.asyncio
async def test_create_draft(client: AsyncClient) -> None:
    response = await client.post("/drafts", json=DRAFT_PAYLOAD)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "My investor pitch"
    assert data["raw_text"] == DRAFT_PAYLOAD["raw_text"]
    assert data["analysis_result"] is None


@pytest.mark.asyncio
async def test_create_draft_text_too_short(client: AsyncClient) -> None:
    response = await client.post("/drafts", json={"title": "T", "raw_text": "short"})
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_analyze_draft(client: AsyncClient) -> None:
    # Create draft
    create_resp = await client.post("/drafts", json=DRAFT_PAYLOAD)
    draft_id = create_resp.json()["id"]

    # Analyze
    analyze_resp = await client.post(f"/drafts/{draft_id}/analyze")
    assert analyze_resp.status_code == 200
    data = analyze_resp.json()
    assert data["improved_text"] == MOCK_GEMINI_RESULT.improved_text
    assert data["feedback_json"]["overall_score"] == 8
    assert data["feedback_json"]["logic"] != ""


@pytest.mark.asyncio
async def test_analyze_draft_idempotent(client: AsyncClient) -> None:
    """Calling analyze twice should return the cached result, not call Gemini again."""
    create_resp = await client.post("/drafts", json=DRAFT_PAYLOAD)
    draft_id = create_resp.json()["id"]

    first = await client.post(f"/drafts/{draft_id}/analyze")
    second = await client.post(f"/drafts/{draft_id}/analyze")
    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["id"] == second.json()["id"]


@pytest.mark.asyncio
async def test_get_draft(client: AsyncClient) -> None:
    create_resp = await client.post("/drafts", json=DRAFT_PAYLOAD)
    draft_id = create_resp.json()["id"]

    response = await client.get(f"/drafts/{draft_id}")
    assert response.status_code == 200
    assert response.json()["id"] == draft_id


@pytest.mark.asyncio
async def test_get_analysis_before_analyze(client: AsyncClient) -> None:
    create_resp = await client.post("/drafts", json=DRAFT_PAYLOAD)
    draft_id = create_resp.json()["id"]

    response = await client.get(f"/drafts/{draft_id}/analysis")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_analysis_after_analyze(client: AsyncClient) -> None:
    create_resp = await client.post("/drafts", json=DRAFT_PAYLOAD)
    draft_id = create_resp.json()["id"]
    await client.post(f"/drafts/{draft_id}/analyze")

    response = await client.get(f"/drafts/{draft_id}/analysis")
    assert response.status_code == 200
    assert response.json()["improved_text"] == MOCK_GEMINI_RESULT.improved_text


@pytest.mark.asyncio
async def test_analyze_gemini_error(client: AsyncClient, monkeypatch) -> None:
    monkeypatch.setattr(
        "app.routers.drafts.analyze_draft",
        lambda text: (_ for _ in ()).throw(GeminiError("API timeout")),
    )
    create_resp = await client.post("/drafts", json=DRAFT_PAYLOAD)
    draft_id = create_resp.json()["id"]

    response = await client.post(f"/drafts/{draft_id}/analyze")
    assert response.status_code == 502


@pytest.mark.asyncio
async def test_draft_not_found(client: AsyncClient) -> None:
    response = await client.get(f"/drafts/{uuid.uuid4()}")
    assert response.status_code == 404
