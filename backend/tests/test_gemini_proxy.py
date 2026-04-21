from app.services import cloud_ru_ai as cloud_ru_service


def test_create_cloud_ru_client_without_proxy(monkeypatch) -> None:
    captured: dict = {}

    def fake_openai(**kwargs):
        captured.update(kwargs)
        return object()

    monkeypatch.setattr(cloud_ru_service, "OpenAI", fake_openai)
    monkeypatch.setattr(cloud_ru_service.settings, "cloud_ru_api_key", "test-key")
    monkeypatch.setattr(cloud_ru_service.settings, "cloud_ru_base_url", "https://foundation-models.api.cloud.ru/v1")
    monkeypatch.setattr(cloud_ru_service.settings, "cloud_ru_timeout_seconds", 30.0)

    cloud_ru_service.create_cloud_ru_client()

    assert captured == {
        "api_key": "test-key",
        "base_url": "https://foundation-models.api.cloud.ru/v1",
        "timeout": 30.0,
    }


def test_create_cloud_ru_client_requires_key(monkeypatch) -> None:
    monkeypatch.setattr(cloud_ru_service.settings, "cloud_ru_api_key", "   ")

    try:
        cloud_ru_service.create_cloud_ru_client()
    except cloud_ru_service.CloudRuAIError as exc:
        assert "Cloud.ru API key is not configured" in str(exc)
    else:
        raise AssertionError("Expected CloudRuAIError when API key is missing")
