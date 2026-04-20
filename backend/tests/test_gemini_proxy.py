from app.services import gemini as gemini_service


def test_create_gemini_client_without_proxy(monkeypatch) -> None:
    captured: dict = {}

    def fake_openai(**kwargs):
        captured.update(kwargs)
        return object()

    monkeypatch.setattr(gemini_service, "OpenAI", fake_openai)
    monkeypatch.setattr(gemini_service.settings, "cloud_ru_api_key", "test-key")
    monkeypatch.setattr(gemini_service.settings, "cloud_ru_base_url", "https://foundation-models.api.cloud.ru/v1")

    gemini_service.create_gemini_client()

    assert captured == {
        "api_key": "test-key",
        "base_url": "https://foundation-models.api.cloud.ru/v1",
    }


def test_create_gemini_client_uses_legacy_rollout_key(monkeypatch) -> None:
    captured: dict = {}

    def fake_openai(**kwargs):
        captured.update(kwargs)
        return object()

    monkeypatch.setattr(gemini_service, "OpenAI", fake_openai)
    monkeypatch.setattr(gemini_service.settings, "cloud_ru_api_key", "legacy-key")
    monkeypatch.setattr(gemini_service.settings, "cloud_ru_base_url", "https://foundation-models.api.cloud.ru/v1")

    gemini_service.create_gemini_client()

    assert captured["api_key"] == "legacy-key"


def test_create_gemini_client_requires_key(monkeypatch) -> None:
    monkeypatch.setattr(gemini_service.settings, "cloud_ru_api_key", "   ")

    try:
        gemini_service.create_gemini_client()
    except gemini_service.GeminiError as exc:
        assert "Cloud.ru API key is not configured" in str(exc)
    else:
        raise AssertionError("Expected GeminiError when API key is missing")
