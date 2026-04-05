from app.services import gemini as gemini_service


def test_create_gemini_client_without_proxy(monkeypatch) -> None:
    captured: dict = {}

    def fake_client(**kwargs):
        captured.update(kwargs)
        return object()

    monkeypatch.setattr(gemini_service.genai, "Client", fake_client)
    monkeypatch.setattr(gemini_service.settings, "gemini_api_key", "test-key")
    monkeypatch.setattr(gemini_service.settings, "gemini_proxy_url", "")

    gemini_service.create_gemini_client()

    assert captured == {"api_key": "test-key"}


def test_create_gemini_client_with_dedicated_proxy(monkeypatch) -> None:
    captured_client: dict = {}
    captured_options: dict = {}
    proxy_url = "http://user:password@151.244.180.197:7635"

    class FakeHttpOptions:
        def __init__(self, **kwargs):
            captured_options.update(kwargs)

    def fake_client(**kwargs):
        captured_client.update(kwargs)
        return object()

    monkeypatch.setattr(gemini_service.genai, "Client", fake_client)
    monkeypatch.setattr(gemini_service.types, "HttpOptions", FakeHttpOptions)
    monkeypatch.setattr(gemini_service.settings, "gemini_api_key", "test-key")
    monkeypatch.setattr(gemini_service.settings, "gemini_proxy_url", proxy_url)

    gemini_service.create_gemini_client()

    assert captured_client["api_key"] == "test-key"
    assert "http_options" in captured_client
    assert captured_options["client_args"] == {"proxy": proxy_url, "trust_env": False}
    assert captured_options["async_client_args"] == {"proxy": proxy_url, "trust_env": False}