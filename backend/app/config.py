from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Database
    database_url: str

    # Supabase
    supabase_url: str
    supabase_key: str
    supabase_storage_bucket: str = "peaktalk-dev-bucket"

    # AI
    gemini_api_key: str

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # App
    app_env: str = "development"
    debug: bool = False

    # Supabase webhook secret (set in Supabase Dashboard → Database → Webhooks → custom header)
    supabase_webhook_secret: str = ""

    # Payment gateway toggle — set to false to disable all payment checks
    # (everyone gets PRO behaviour, no limit enforcement, payment buttons hidden)
    payments_enabled: bool = True

    # YooKassa payment integration
    yookassa_shop_id: str = ""
    yookassa_secret_key: str = ""
    yookassa_webhook_secret: str = ""

    # Public frontend URL (used as default return_url fallback)
    frontend_url: str = "https://peaktalk.ru"

    # CORS — comma-separated origins, e.g. "http://localhost:3000,https://peaktalk.io"
    allowed_origins: str = "http://localhost:3000"

    def get_allowed_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    # Admin panel — comma-separated list of emails with admin access
    admin_emails: str = ""

    def get_admin_emails(self) -> list[str]:
        return [e.strip() for e in self.admin_emails.split(",") if e.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
