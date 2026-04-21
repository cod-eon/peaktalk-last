from functools import lru_cache

from pydantic import Field
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
    cloud_ru_api_key: str = Field(default="")
    cloud_ru_base_url: str = "https://foundation-models.api.cloud.ru/v1"
    cloud_ru_model: str = "Qwen/Qwen3-Coder-Next"
    cloud_ru_timeout_seconds: float = 30.0
    ai_detection_llm_enabled: bool = False

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Push Notification (VAPID)
    vapid_private_key: str = ""
    vapid_public_key: str = ""
    vapid_subject: str = "mailto:hello@peaktalk.ru"

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

    # 54-FZ receipt settings (fiscalization)
    # Самозанятые (НПД) НЕ используют ККТ — чеки формируются через "Мой налог".
    # Включайте только если вы ИП/ООО с подключённым ОФД.
    yookassa_send_receipt: bool = False
    # tax_system_code: 1=ОСН, 2=УСН доход, 3=УСН доход-расход, 6=ПСН
    yookassa_tax_system_code: int = 2

    # Feature Flags (DevCycle)
    devcycle_server_sdk_key: str = ""
    # vat_code per item: 1=без НДС, 3=10%, 4=20%
    yookassa_vat_code: int = 1

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
