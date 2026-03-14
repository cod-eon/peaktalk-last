import uuid

import pytest
from httpx import AsyncClient

from app.services.gemini import GeminiError
from app.services.simulation_ai import SimulationTurn, SkillEvaluation

MOCK_TURN = SimulationTurn(
    internal_reasoning="The presenter mentioned AI — let me probe the business model.",
    question="What's your customer acquisition cost, and how does it scale?",
    difficulty_level=4,
)

MOCK_EVALUATION = SkillEvaluation(metrics=[
    {"name": "clarity", "score": 0.8, "comment": "Answers were clear and direct."},
    {"name": "argumentation", "score": 0.7, "comment": "Good use of data points."},
    {"name": "stress_resistance", "score": 0.75, "comment": "Stayed composed under pressure."},
    {"name": "structure", "score": 0.65, "comment": "Slight tangents, but mostly structured."},
    {"name": "conciseness", "score": 0.9, "comment": "Very concise responses."},
])

START_PAYLOAD = {
    "persona_config": {"role": "investor", "industry": "edtech", "difficulty": 3},
    "draft_id": None,
}


@pytest.fixture(autouse=True)
def mock_ai(monkeypatch):
    monkeypatch.setattr("app.routers.simulation.generate_question", lambda **kw: MOCK_TURN)
    monkeypatch.setattr("app.routers.simulation.evaluate_session", lambda **kw: MOCK_EVALUATION)


@pytest.fixture
async def draft_id(client: AsyncClient) -> str:
    resp = await client.post("/drafts", json={
        "title": "PeakTalk Pitch",
        "raw_text": "PeakTalk is an AI coach for public speaking. We target students and founders.",
    })
    return resp.json()["id"]


@pytest.fixture
async def session_id(client: AsyncClient, draft_id: str) -> str:
    payload = {**START_PAYLOAD, "draft_id": draft_id}
    resp = await client.post("/simulation/start", json=payload)
    assert resp.status_code == 201
    return resp.json()["id"]


@pytest.mark.asyncio
async def test_start_simulation(client: AsyncClient, draft_id: str) -> None:
    payload = {**START_PAYLOAD, "draft_id": draft_id}
    resp = await client.post("/simulation/start", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] == "active"
    assert len(data["messages"]) == 1
    assert data["messages"][0]["role"] == "assistant"
    assert data["messages"][0]["content"] == MOCK_TURN.question
    assert data["messages"][0]["internal_reasoning"] == MOCK_TURN.internal_reasoning


@pytest.mark.asyncio
async def test_start_without_source_fails(client: AsyncClient) -> None:
    resp = await client.post("/simulation/start", json={
        "persona_config": {"role": "hr", "industry": "general", "difficulty": 2},
    })
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_send_message(client: AsyncClient, session_id: str) -> None:
    resp = await client.post(
        f"/simulation/{session_id}/message",
        json={"content": "Our CAC is $15 and scales linearly with paid channels."},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["user_message"]["role"] == "user"
    assert data["assistant_message"]["role"] == "assistant"
    assert data["user_message"]["turn_index"] == 1
    assert data["assistant_message"]["turn_index"] == 2


@pytest.mark.asyncio
async def test_get_history(client: AsyncClient, session_id: str) -> None:
    await client.post(
        f"/simulation/{session_id}/message",
        json={"content": "Our growth is 20% MoM."},
    )
    resp = await client.get(f"/simulation/{session_id}/history")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["messages"]) == 3  # first question + user + AI follow-up


@pytest.mark.asyncio
async def test_complete_session(client: AsyncClient, session_id: str) -> None:
    # Need at least one user message
    await client.post(
        f"/simulation/{session_id}/message",
        json={"content": "We have strong retention metrics, D7 retention is 40%."},
    )
    resp = await client.post(f"/simulation/{session_id}/complete")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "completed"
    assert data["completed_at"] is not None
    assert len(data["skill_metrics"]) == 5
    metric_names = {m["metric_name"] for m in data["skill_metrics"]}
    assert "clarity" in metric_names
    assert "argumentation" in metric_names


@pytest.mark.asyncio
async def test_complete_session_no_answers_fails(client: AsyncClient, session_id: str) -> None:
    resp = await client.post(f"/simulation/{session_id}/complete")
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_get_report(client: AsyncClient, session_id: str) -> None:
    await client.post(f"/simulation/{session_id}/message", json={"content": "Answer."})
    await client.post(f"/simulation/{session_id}/complete")

    resp = await client.get(f"/simulation/{session_id}/report")
    assert resp.status_code == 200
    assert resp.json()["status"] == "completed"


@pytest.mark.asyncio
async def test_report_on_active_session_fails(client: AsyncClient, session_id: str) -> None:
    resp = await client.get(f"/simulation/{session_id}/report")
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_message_on_completed_session_fails(client: AsyncClient, session_id: str) -> None:
    await client.post(f"/simulation/{session_id}/message", json={"content": "Answer."})
    await client.post(f"/simulation/{session_id}/complete")

    resp = await client.post(f"/simulation/{session_id}/message", json={"content": "Late answer."})
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_session_not_found(client: AsyncClient) -> None:
    resp = await client.get(f"/simulation/{uuid.uuid4()}/history")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_gemini_error_on_start(client: AsyncClient, draft_id: str, monkeypatch) -> None:
    monkeypatch.setattr(
        "app.routers.simulation.generate_question",
        lambda **kw: (_ for _ in ()).throw(GeminiError("timeout")),
    )
    resp = await client.post("/simulation/start", json={**START_PAYLOAD, "draft_id": draft_id})
    assert resp.status_code == 502
