import uuid

import pytest
from httpx import AsyncClient

from app.models.scenario import Scenario, ScenarioCategory
from app.services.simulation_ai import SimulationTurn


MOCK_TURN = SimulationTurn(
    internal_reasoning="Need to pressure-test the argument.",
    question="Почему этот план должен сработать именно сейчас?",
    difficulty_level=4,
)


async def _mock_generate_question(**kw) -> SimulationTurn:
    return MOCK_TURN


@pytest.fixture(autouse=True)
def mock_ai(monkeypatch):
    monkeypatch.setattr("app.routers.simulation.generate_question", _mock_generate_question)


@pytest.fixture
async def scenario_data(db_session) -> dict[str, str]:
    slug = f"budget-defense-{uuid.uuid4().hex[:8]}"
    scenario = Scenario(
        id=uuid.uuid4(),
        slug=slug,
        category=ScenarioCategory.budget,
        title="Защита бюджета Q3",
        subtitle="CFO режет бюджет и ждёт цифры",
        situation="Нужно защитить бюджет перед CFO.",
        simulation_context="Контекст сценария для жёсткого разговора с CFO.",
        recommended_persona="cfo",
        recommended_difficulty=4,
        tags=["budget", "cfo"],
        is_active=True,
        is_featured=True,
    )
    db_session.add(scenario)
    await db_session.commit()
    return {"id": str(scenario.id), "slug": slug}


@pytest.mark.asyncio
async def test_list_scenarios(client: AsyncClient, scenario_data: dict[str, str]) -> None:
    resp = await client.get("/scenarios")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 1
    slugs = {item["slug"] for item in data["items"]}
    assert scenario_data["slug"] in slugs
    assert any(item["persona"] == "cfo" for item in data["items"])


@pytest.mark.asyncio
async def test_list_scenario_categories(client: AsyncClient, scenario_data: dict[str, str]) -> None:
    resp = await client.get("/scenarios/categories")
    assert resp.status_code == 200
    data = resp.json()
    assert any(item["id"] == "budget" and item["count"] >= 1 for item in data)


@pytest.mark.asyncio
async def test_get_scenario_detail(client: AsyncClient, scenario_data: dict[str, str]) -> None:
    resp = await client.get(f"/scenarios/{scenario_data['slug']}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["slug"] == scenario_data["slug"]
    assert data["situation"] == "Нужно защитить бюджет перед CFO."


@pytest.mark.asyncio
async def test_start_simulation_from_scenario(client: AsyncClient, scenario_data: dict[str, str]) -> None:
    resp = await client.post(
        "/simulation/start-from-scenario",
        json={"scenario_id": scenario_data["id"], "difficulty": 5},
    )
    assert resp.status_code == 201
    session_id = resp.json()["id"]

    history_resp = await client.get(f"/simulation/{session_id}/history")
    assert history_resp.status_code == 200
    data = history_resp.json()
    assert data["persona_config"]["role"] == "cfo"
    assert data["persona_config"]["difficulty"] == 5
    assert data["messages"][0]["content"] == MOCK_TURN.question
