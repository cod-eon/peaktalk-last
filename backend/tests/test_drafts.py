import uuid

import pytest
from httpx import AsyncClient

from app.services.cloud_ru_ai import CloudRuAIError, CloudRuAnalysisResult

MOCK_CLOUD_RU_RESULT = CloudRuAnalysisResult(
    improved_text="This is the strengthened version of the meeting material.",
    feedback={
        "logic": "Good logical structure with clear sections.",
        "style": "Professional tone, appropriate for business context.",
        "clarity": "Clear and concise, no unnecessary filler.",
        "grammar": "No grammatical errors detected.",
        "overall_score": 8,
        "defense_brief": {
            "evidence_gaps": ["Add the payback number before the CFO review."],
            "pressure_questions": ["Why is this budget still worth protecting this quarter?"],
            "next_moves": ["Tie the ask to one owner, one metric, and one decision deadline."],
        },
    },
)

DRAFT_PAYLOAD = {
    "title": "Roadmap budget defense memo",
    "raw_text": (
        "We need to defend the Q3 roadmap budget in front of the CEO and CFO. "
        "The material explains payback, client risk, trade-offs, and the decision we need this week."
    ),
}


async def _mock_analyze_draft_ok(text: str, **kwargs) -> CloudRuAnalysisResult:
    return MOCK_CLOUD_RU_RESULT


async def _mock_analyze_draft_error(text: str, **kwargs) -> CloudRuAnalysisResult:
    raise CloudRuAIError("API timeout")


@pytest.fixture(autouse=True)
def mock_cloud_ru(monkeypatch):
    monkeypatch.setattr("app.routers.drafts.analyze_draft", _mock_analyze_draft_ok)


@pytest.mark.asyncio
async def test_create_draft(client: AsyncClient) -> None:
    response = await client.post("/drafts", json=DRAFT_PAYLOAD)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Roadmap budget defense memo"
    assert data["raw_text"] == DRAFT_PAYLOAD["raw_text"]
    assert data["case_context"] is None
    assert data["analysis_result"] is None


@pytest.mark.asyncio
async def test_create_draft_accepts_case_context(client: AsyncClient) -> None:
    payload = {
        **DRAFT_PAYLOAD,
        "case_context": {
            "situation_id": "budget_defense",
            "situation_label": "Защита бюджета",
            "opponent_role": "CFO",
            "desired_output": "pressure_scan",
        },
    }

    response = await client.post("/drafts", json=payload)

    assert response.status_code == 201
    data = response.json()
    for key, value in payload["case_context"].items():
        assert data["case_context"][key] == value


@pytest.mark.asyncio
async def test_create_draft_text_too_short(client: AsyncClient) -> None:
    response = await client.post("/drafts", json={"title": "T", "raw_text": "short"})
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_analyze_draft(client: AsyncClient) -> None:
    create_resp = await client.post("/drafts", json=DRAFT_PAYLOAD)
    draft_id = create_resp.json()["id"]

    analyze_resp = await client.post(f"/drafts/{draft_id}/analyze")
    assert analyze_resp.status_code == 200
    data = analyze_resp.json()
    assert data["improved_text"] == MOCK_CLOUD_RU_RESULT.improved_text
    assert data["feedback_json"]["overall_score"] == 8
    assert data["feedback_json"]["logic"] != ""
    assert data["feedback_json"]["defense_brief"]["evidence_gaps"] == [
        "Add the payback number before the CFO review."
    ]


@pytest.mark.asyncio
async def test_analyze_draft_passes_case_context_to_ai(client: AsyncClient, monkeypatch) -> None:
    captured: dict = {}

    async def capture_analyze_draft(text: str, **kwargs) -> CloudRuAnalysisResult:
        captured["text"] = text
        captured["user_context"] = kwargs.get("user_context")
        return MOCK_CLOUD_RU_RESULT

    monkeypatch.setattr("app.routers.drafts.analyze_draft", capture_analyze_draft)
    case_context = {
        "situation_id": "client_escalation",
        "situation_label": "Клиентская эскалация",
        "opponent_role": "Недовольный клиент",
        "desired_output": "full_rewrite",
    }
    create_resp = await client.post("/drafts", json={**DRAFT_PAYLOAD, "case_context": case_context})
    draft_id = create_resp.json()["id"]

    analyze_resp = await client.post(f"/drafts/{draft_id}/analyze")

    assert analyze_resp.status_code == 200
    assert captured["text"] == DRAFT_PAYLOAD["raw_text"]
    assert captured["user_context"]["case_context"] == case_context


@pytest.mark.asyncio
async def test_analyze_draft_idempotent(client: AsyncClient) -> None:
    """Calling analyze twice should return the cached result, not call Cloud.ru again."""
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
    assert response.json()["improved_text"] == MOCK_CLOUD_RU_RESULT.improved_text
    assert response.json()["feedback_json"]["defense_brief"]["pressure_questions"] == [
        "Why is this budget still worth protecting this quarter?"
    ]


@pytest.mark.asyncio
async def test_analyze_cloud_ru_error(client: AsyncClient, monkeypatch) -> None:
    monkeypatch.setattr("app.routers.drafts.analyze_draft", _mock_analyze_draft_error)
    create_resp = await client.post("/drafts", json=DRAFT_PAYLOAD)
    draft_id = create_resp.json()["id"]

    response = await client.post(f"/drafts/{draft_id}/analyze")
    assert response.status_code == 502


@pytest.mark.asyncio
async def test_draft_not_found(client: AsyncClient) -> None:
    response = await client.get(f"/drafts/{uuid.uuid4()}")
    assert response.status_code == 404
