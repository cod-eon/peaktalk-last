import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient) -> None:
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_get_me(client: AsyncClient) -> None:
    response = await client.get("/me")
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@peaktalk.io"
    assert data["onboarding_profile"] is None


@pytest.mark.asyncio
async def test_save_onboarding(client: AsyncClient) -> None:
    payload = {"segment": "founder", "primary_goal": "pitch"}
    response = await client.post("/me/onboarding", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["onboarding_profile"]["segment"] == "founder"
    assert data["onboarding_profile"]["primary_goal"] == "pitch"


@pytest.mark.asyncio
async def test_save_onboarding_update(client: AsyncClient) -> None:
    # First save
    await client.post("/me/onboarding", json={"segment": "student", "primary_goal": "defense"})
    # Update
    response = await client.post("/me/onboarding", json={"segment": "junior", "primary_goal": "interview"})
    assert response.status_code == 200
    data = response.json()
    assert data["onboarding_profile"]["segment"] == "junior"
    assert data["onboarding_profile"]["primary_goal"] == "interview"
