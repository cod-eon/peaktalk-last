from datetime import datetime, timedelta, timezone

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_qbr_prepare_simulation_suggests_client_opponent(client: AsyncClient) -> None:
    create_resp = await client.post("/meetings", json={
        "title": "QBR с ключевым клиентом",
        "description": "Нужно защитить продление и план внедрения.",
        "meeting_date": (datetime.now(timezone.utc) + timedelta(days=3)).isoformat(),
        "meeting_type": "qbr",
        "scenario_id": "",
    })
    assert create_resp.status_code == 201

    meeting_id = create_resp.json()["id"]
    prepare_resp = await client.get(f"/meetings/{meeting_id}/prepare-simulation")

    assert prepare_resp.status_code == 200
    data = prepare_resp.json()
    assert data["status"] == "ready"
    assert data["suggested_role"] == "client"
    assert data["meeting_type"] == "qbr"


@pytest.mark.asyncio
async def test_client_meeting_prepare_simulation_suggests_client_opponent(client: AsyncClient) -> None:
    create_resp = await client.post("/meetings", json={
        "title": "Эскалация клиента",
        "description": "Нужно защитить план восстановления SLA.",
        "meeting_date": (datetime.now(timezone.utc) + timedelta(days=2)).isoformat(),
        "meeting_type": "client_meeting",
        "scenario_id": "",
    })
    assert create_resp.status_code == 201

    meeting_id = create_resp.json()["id"]
    prepare_resp = await client.post(f"/meetings/{meeting_id}/prepare-simulation")

    assert prepare_resp.status_code == 200
    data = prepare_resp.json()
    assert data["status"] == "ready"
    assert data["suggested_role"] == "client"
    assert data["meeting_type"] == "client_meeting"
