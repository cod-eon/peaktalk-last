import uuid
from datetime import datetime, timedelta, timezone

import pytest
from httpx import AsyncClient
from sqlalchemy import func, select

from app.models.guest import GuestSession
from app.models.personalized_persona import PersonalizedPersona
from app.models.draft import SpeechDraft
from app.models.simulation import ArtifactType, SessionArtifact, SessionStatus, SimulationSession
from app.services.limits import get_usage_counter
from app.services.cloud_ru_ai import CloudRuAIError
from app.services.simulation_ai import SimulationTurn, SkillEvaluation
from .conftest import TEST_USER_ID

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

MOCK_PREP_CARD = {
    "top_arguments": [
        {"text": "Мы растем 20% MoM", "strength": "high", "anchor_phrase": "Рост стабилен и подтвержден данными"},
        {"text": "CAC под контролем", "strength": "medium", "anchor_phrase": "Экономика канала прозрачна"},
        {"text": "Retention высокий", "strength": "high", "anchor_phrase": "Retention доказывает ценность"},
    ],
    "anchor_phrases": ["Рост стабилен и подтвержден данными"],
    "danger_zones": [
        {"topic": "Юнит-экономика", "risk": "Ответ был слишком общим", "suggested_response": "Назовите CAC, LTV и payback."},
    ],
    "key_numbers": ["20% MoM", "CAC $15"],
    "opening_move": "Начну с главной метрики роста.",
}

START_PAYLOAD = {
    "source_type": "system",
    "persona_config": {"role": "investor"},
    "industry": "edtech",
    "difficulty": 3,
    "draft_id": None,
}


async def _mock_generate_question(**kw) -> SimulationTurn:
    return MOCK_TURN


async def _mock_evaluate_session(**kw) -> SkillEvaluation:
    return MOCK_EVALUATION


async def _mock_generate_prep_card(**kw) -> dict:
    return MOCK_PREP_CARD


async def _mock_generate_question_error(**kw) -> SimulationTurn:
    raise CloudRuAIError("timeout")


@pytest.fixture(autouse=True)
def mock_ai(monkeypatch):
    monkeypatch.setattr("app.routers.simulation.generate_question", _mock_generate_question)
    monkeypatch.setattr("app.routers.guest_simulation.generate_question", _mock_generate_question)
    monkeypatch.setattr("app.routers.simulation.evaluate_session", _mock_evaluate_session)
    monkeypatch.setattr("app.routers.simulation.generate_prep_card", _mock_generate_prep_card)


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
async def test_guest_start_creates_session(client: AsyncClient) -> None:
    resp = await client.post("/simulation/guest-start", json={
        "text": "Нужно защитить бюджет внедрения перед CFO и показать риски сокращения.",
        "persona": "cfo",
        "difficulty": 5,
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["first_question"] == MOCK_TURN.question
    assert data["turn"] == 1
    assert data["max_turns"] == 3
    assert data["remaining_turns"] == 2


@pytest.mark.asyncio
async def test_guest_flow_asks_three_questions_before_paywall(
    client: AsyncClient,
    db_session,
) -> None:
    start_resp = await client.post("/simulation/guest-start", json={
        "text": "Нужно защитить бюджет внедрения перед CFO и показать риски сокращения.",
        "persona": "cfo",
        "difficulty": 5,
    })
    assert start_resp.status_code == 201
    start_data = start_resp.json()
    token = start_data["guest_session_id"]
    assert start_data["turn"] == 1
    assert start_data["first_question"] == MOCK_TURN.question

    first_answer_resp = await client.post("/simulation/guest-message", json={
        "guest_session_id": token,
        "content": "Сокращение бюджета сдвинет релиз и сорвет контракт.",
    })
    assert first_answer_resp.status_code == 200
    first_answer_data = first_answer_resp.json()
    assert first_answer_data["turn"] == 2
    assert first_answer_data["remaining_turns"] == 1
    assert first_answer_data["limit_reached"] is False
    assert first_answer_data["question"] == MOCK_TURN.question
    assert first_answer_data["paywall"] is None

    second_answer_resp = await client.post("/simulation/guest-message", json={
        "guest_session_id": token,
        "content": "Мы можем урезать второстепенный scope, но не core-интеграцию.",
    })
    assert second_answer_resp.status_code == 200
    second_answer_data = second_answer_resp.json()
    assert second_answer_data["turn"] == 3
    assert second_answer_data["remaining_turns"] == 0
    assert second_answer_data["limit_reached"] is False
    assert second_answer_data["question"] == MOCK_TURN.question
    assert second_answer_data["paywall"] is None

    final_answer_resp = await client.post("/simulation/guest-message", json={
        "guest_session_id": token,
        "content": "Финальный аргумент: экономия сейчас дороже потери окна у клиента.",
    })
    assert final_answer_resp.status_code == 200
    final_answer_data = final_answer_resp.json()
    assert final_answer_data["turn"] == 3
    assert final_answer_data["remaining_turns"] == 0
    assert final_answer_data["limit_reached"] is True
    assert final_answer_data["question"] is None
    assert final_answer_data["paywall"]["cta_primary"]["action"] == "pay_per_session"

    result = await db_session.execute(
        select(GuestSession).where(GuestSession.session_token == token)
    )
    guest = result.scalar_one()
    assert guest.turn_count == 3
    assert [message["role"] for message in guest.messages] == [
        "assistant",
        "user",
        "assistant",
        "user",
        "assistant",
        "user",
    ]


@pytest.mark.asyncio
async def test_guest_start_rejects_missing_required_field(client: AsyncClient) -> None:
    resp = await client.post("/simulation/guest-start", json={
        "persona": "cfo",
        "difficulty": 3,
    })
    assert resp.status_code == 422
    assert any(
        error["type"] == "missing" and error["loc"][-1] == "text"
        for error in resp.json()["detail"]
    )


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
async def test_start_without_source_succeeds(client: AsyncClient) -> None:
    """Starting simulation without a document is valid — AI uses general questions."""
    resp = await client.post("/simulation/start", json={
        "source_type": "system",
        "persona_config": {"role": "hr"},
        "industry": "general",
        "difficulty": 2,
    })
    assert resp.status_code == 201
    assert resp.json()["status"] == "active"


@pytest.mark.asyncio
async def test_start_from_guest_uses_public_token_and_active_status(
    client: AsyncClient,
    db_session,
) -> None:
    token = str(uuid.uuid4())
    guest = GuestSession(
        session_token=token,
        text="Нужно защитить бюджет внедрения перед CFO и показать риски сокращения.",
        persona="cfo",
        difficulty=3,
        turn_count=1,
        messages=[
            {"role": "system", "content": "internal setup"},
            {"role": "assistant", "content": "Почему это нельзя сократить?"},
            {"role": "user", "content": "Потому что релиз сдвинется."},
        ],
        expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
    )
    db_session.add(guest)
    await db_session.commit()

    counter = await get_usage_counter(str(TEST_USER_ID), db_session)
    counter.session_credits = 1
    await db_session.commit()

    resp = await client.post("/simulation/from-guest", json={
        "guest_session_id": token,
        "difficulty": 3,
    })

    assert resp.status_code == 201
    session = await db_session.get(SimulationSession, uuid.UUID(resp.json()["id"]))
    assert session is not None
    assert session.status == SessionStatus.active
    assert session.persona_config["paid_access"] is True
    assert session.draft_id is not None
    draft = await db_session.get(SpeechDraft, session.draft_id)
    assert draft is not None
    assert draft.raw_text == guest.text

    counter = await get_usage_counter(str(TEST_USER_ID), db_session)
    await db_session.refresh(counter)
    assert counter.session_credits == 0


@pytest.mark.asyncio
async def test_start_from_guest_requires_session_credit(
    client: AsyncClient,
    db_session,
) -> None:
    token = str(uuid.uuid4())
    guest = GuestSession(
        session_token=token,
        text="Нужно защитить бюджет внедрения перед CFO и показать риски сокращения.",
        persona="cfo",
        difficulty=3,
        turn_count=3,
        messages=[
            {"role": "assistant", "content": "Почему это нельзя сократить?"},
            {"role": "user", "content": "Потому что релиз сдвинется."},
            {"role": "assistant", "content": "Что скажете CFO про экономику?"},
            {"role": "user", "content": "Покажу стоимость задержки."},
            {"role": "assistant", "content": "Какая самая слабая часть позиции?"},
            {"role": "user", "content": "Нужно уточнить риск по клиенту."},
        ],
        expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
    )
    db_session.add(guest)
    await db_session.commit()

    counter = await get_usage_counter(str(TEST_USER_ID), db_session)
    counter.session_credits = 0
    counter.simulations_used = 0
    await db_session.commit()

    resp = await client.post("/simulation/from-guest", json={
        "guest_session_id": token,
        "difficulty": 3,
    })

    assert resp.status_code == 402
    body = resp.json()
    assert body["detail"]["code"] == "session_credit_required"
    await db_session.refresh(counter)
    assert counter.session_credits == 0
    assert counter.simulations_used == 0


@pytest.mark.asyncio
async def test_start_from_guest_rejects_expired_guest_without_consuming_credit(
    client: AsyncClient,
    db_session,
) -> None:
    token = str(uuid.uuid4())
    guest = GuestSession(
        session_token=token,
        text="Expired guest defense material",
        persona="cfo",
        difficulty=3,
        turn_count=3,
        messages=[
            {"role": "assistant", "content": "Почему это нельзя сократить?"},
            {"role": "user", "content": "Потому что релиз сдвинется."},
        ],
        expires_at=datetime.now(timezone.utc) - timedelta(minutes=1),
    )
    db_session.add(guest)
    await db_session.commit()

    counter = await get_usage_counter(str(TEST_USER_ID), db_session)
    counter.session_credits = 1
    counter.simulations_used = 0
    await db_session.commit()

    resp = await client.post("/simulation/from-guest", json={
        "guest_session_id": token,
        "difficulty": 3,
    })

    assert resp.status_code == 410
    assert resp.json()["detail"]["code"] == "guest_session_expired"
    await db_session.refresh(counter)
    assert counter.session_credits == 1
    assert counter.simulations_used == 0


@pytest.mark.asyncio
async def test_start_from_guest_retry_returns_existing_session_without_extra_credit(
    client: AsyncClient,
    db_session,
) -> None:
    token = str(uuid.uuid4())
    guest_text = f"Retry-safe guest defense material {token}"
    guest = GuestSession(
        session_token=token,
        text=guest_text,
        persona="cfo",
        difficulty=3,
        turn_count=3,
        messages=[
            {"role": "assistant", "content": "Почему это нельзя сократить?"},
            {"role": "user", "content": "Потому что релиз сдвинется."},
            {"role": "assistant", "content": "Что скажете CFO про экономику?"},
            {"role": "user", "content": "Покажу стоимость задержки."},
        ],
        expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
    )
    db_session.add(guest)
    await db_session.commit()

    counter = await get_usage_counter(str(TEST_USER_ID), db_session)
    counter.session_credits = 2
    counter.simulations_used = 0
    await db_session.commit()

    before_sessions = await db_session.scalar(
        select(func.count(SimulationSession.id)).where(SimulationSession.user_id == TEST_USER_ID)
    )

    first_resp = await client.post("/simulation/from-guest", json={
        "guest_session_id": token,
        "difficulty": 3,
    })
    second_resp = await client.post("/simulation/from-guest", json={
        "guest_session_id": token,
        "difficulty": 3,
    })

    assert first_resp.status_code == 201
    assert second_resp.status_code == 201
    assert second_resp.json()["id"] == first_resp.json()["id"]

    after_sessions = await db_session.scalar(
        select(func.count(SimulationSession.id)).where(SimulationSession.user_id == TEST_USER_ID)
    )
    assert after_sessions == before_sessions + 1

    drafts = await db_session.scalars(
        select(SpeechDraft).where(
            SpeechDraft.user_id == TEST_USER_ID,
            SpeechDraft.raw_text == guest_text,
        )
    )
    assert len(drafts.all()) == 1

    result = await db_session.execute(
        select(GuestSession).where(GuestSession.session_token == token)
    )
    migrated_guest = result.scalar_one()
    assert str(migrated_guest.migrated_session_id) == first_resp.json()["id"]
    assert migrated_guest.migrated_at is not None

    await db_session.refresh(counter)
    assert counter.session_credits == 1
    assert counter.simulations_used == 1


@pytest.fixture
async def custom_persona_id(db_session) -> str:
    persona = PersonalizedPersona(
        user_id=TEST_USER_ID,
        name="Строгий CTO",
        role="CTO",
        background="15 лет строит B2B SaaS",
        communication_style="Режет воду, требует факты",
        catch_phrases=["Где доказательства?"],
        focus_areas=["риски", "архитектура"],
        difficulty_hint=5,
        usage_count=0,
    )
    db_session.add(persona)
    await db_session.commit()
    return str(persona.id)


@pytest.mark.asyncio
async def test_start_custom_simulation_creates_snapshot(
    client: AsyncClient,
    db_session,
    custom_persona_id: str,
) -> None:
    resp = await client.post("/simulation/start", json={
        "source_type": "custom",
        "persona_id": custom_persona_id,
        "industry": "fintech",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["persona_config"]["source_type"] == "custom"
    assert data["persona_config"]["persona_id"] == custom_persona_id
    assert data["persona_config"]["persona_name"] == "Строгий CTO"
    assert data["persona_config"]["role"] == "CTO"
    assert data["persona_config"]["difficulty"] == 5
    assert data["messages"][0]["content"] == MOCK_TURN.question

    persona = await db_session.get(PersonalizedPersona, uuid.UUID(custom_persona_id))
    assert persona is not None
    assert persona.usage_count == 1


@pytest.mark.asyncio
async def test_custom_simulation_snapshot_does_not_mutate_after_persona_update(
    client: AsyncClient,
    db_session,
    custom_persona_id: str,
) -> None:
    start_resp = await client.post("/simulation/start", json={
        "source_type": "custom",
        "persona_id": custom_persona_id,
        "industry": "fintech",
    })
    assert start_resp.status_code == 201
    session_id = start_resp.json()["id"]

    persona = await db_session.get(PersonalizedPersona, uuid.UUID(custom_persona_id))
    assert persona is not None
    persona.name = "Обновленный CTO"
    persona.communication_style = "Теперь мягче"
    await db_session.commit()

    session = await db_session.get(SimulationSession, uuid.UUID(session_id))
    assert session is not None
    assert session.persona_config["persona_name"] == "Строгий CTO"
    assert session.persona_config["communication_style"] == "Режет воду, требует факты"


@pytest.mark.asyncio
async def test_custom_simulation_rejects_missing_persona_id(client: AsyncClient) -> None:
    resp = await client.post("/simulation/start", json={
        "source_type": "custom",
        "industry": "fintech",
    })
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_start_rejects_hybrid_payload(
    client: AsyncClient,
    custom_persona_id: str,
) -> None:
    resp = await client.post("/simulation/start", json={
        "source_type": "custom",
        "persona_id": custom_persona_id,
        "persona_config": {"role": "investor"},
        "industry": "fintech",
    })
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_start_custom_simulation_rejects_foreign_persona(client: AsyncClient, db_session) -> None:
    foreign_persona = PersonalizedPersona(
        user_id=uuid.uuid4(),
        name="Чужой инвестор",
        role="Investor",
        communication_style="Холодный",
        difficulty_hint=4,
    )
    db_session.add(foreign_persona)
    await db_session.commit()

    resp = await client.post("/simulation/start", json={
        "source_type": "custom",
        "persona_id": str(foreign_persona.id),
        "industry": "fintech",
    })
    assert resp.status_code == 403


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
async def test_complete_session_creates_prep_card_artifact(client: AsyncClient, session_id: str) -> None:
    await client.post(f"/simulation/{session_id}/message", json={"content": "Answer."})
    complete_resp = await client.post(f"/simulation/{session_id}/complete")
    assert complete_resp.status_code == 200

    session_resp = await client.get(f"/simulation/{session_id}/history")
    assert session_resp.status_code == 200

    from .conftest import TestSessionLocal

    # We need to manually run the artifact creation logic because background tasks
    # don't share the in-memory SQLite database properly without explicit passing.
    from app.routers.simulation import _ensure_prep_card_artifact
    from app.routers.simulation import _load_session

    async with TestSessionLocal() as db:
        # Load the session within our test DB context
        session = await _load_session(db, uuid.UUID(session_id), TEST_USER_ID)
        await _ensure_prep_card_artifact(session, db)
        await db.commit()

        from sqlalchemy import select
        artifact_res = await db.execute(
            select(SessionArtifact).where(
                SessionArtifact.session_id == uuid.UUID(session_id),
                SessionArtifact.artifact_type == ArtifactType.prep_card,
            )
        )
        artifact = artifact_res.scalar_one_or_none()
        assert artifact is not None
        assert artifact.content["opening_move"] == MOCK_PREP_CARD["opening_move"]
        assert artifact.content["top_arguments"][0]["text"] == MOCK_PREP_CARD["top_arguments"][0]["text"]


@pytest.mark.asyncio
async def test_paid_session_can_access_prep_card_artifact(client: AsyncClient, session_id: str) -> None:
    await client.post(f"/simulation/{session_id}/message", json={"content": "Answer."})
    complete_resp = await client.post(f"/simulation/{session_id}/complete")
    assert complete_resp.status_code == 200

    from .conftest import TestSessionLocal
    from app.routers.simulation import _ensure_prep_card_artifact
    from app.routers.simulation import _load_session

    async with TestSessionLocal() as db:
        session = await _load_session(db, uuid.UUID(session_id), TEST_USER_ID)
        session.persona_config = {
            **(session.persona_config or {}),
            "paid_access": True,
        }
        await _ensure_prep_card_artifact(session, db)

        counter = await get_usage_counter(str(TEST_USER_ID), db)
        counter.session_credits = 0
        await db.commit()

    resp = await client.get(f"/simulation/{session_id}/artifact")

    assert resp.status_code == 200
    data = resp.json()
    assert data["available"] is True
    assert data["artifact"]["opening_move"] == MOCK_PREP_CARD["opening_move"]
    assert data["teaser"] is None
    assert data["paywall"] is None


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
async def test_cloud_ru_error_on_start(client: AsyncClient, draft_id: str, monkeypatch) -> None:
    monkeypatch.setattr("app.routers.simulation.generate_question", _mock_generate_question_error)
    resp = await client.post("/simulation/start", json={**START_PAYLOAD, "draft_id": draft_id})
    assert resp.status_code == 502
