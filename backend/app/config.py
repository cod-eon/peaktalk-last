from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Database
    database_url: str
    database_pool_size: int = Field(default=10, ge=1, le=100)
    database_max_overflow: int = Field(default=20, ge=0, le=100)
    database_pool_timeout_seconds: float = Field(default=30.0, gt=0, le=300)
    database_command_timeout_seconds: float = Field(default=60.0, gt=0, le=600)

    # Logto OSS authentication
    auth_provider: Literal["logto"] = "logto"
    logto_issuer: str = "https://auth.peaktalk.ru/oidc"
    logto_jwks_uri: str = "https://auth.peaktalk.ru/oidc/jwks"
    logto_userinfo_url: str = "https://auth.peaktalk.ru/oidc/me"
    logto_audience: str = ""
    logto_required_scopes: str = ""
    # HMAC secret shared only by the Next.js server and FastAPI. The frontend
    # uses it to sign verified identity claims from the Logto server session;
    # the API never trusts email claims supplied directly by the browser.
    logto_identity_assertion_secret: str = ""
    logto_http_timeout_seconds: float = Field(default=5.0, gt=0, le=30)

    # Yandex Object Storage
    storage_provider: Literal["yandex"] = "yandex"
    yandex_s3_endpoint_url: str = "https://storage.yandexcloud.net"
    yandex_s3_region: str = "ru-central1"
    yandex_s3_bucket: str = "peaktalk-prod-private-documents"
    yandex_s3_kms_key_id: str = ""
    yandex_s3_access_key_id: str = ""
    yandex_s3_secret_access_key: str = ""
    yandex_s3_presign_ttl_seconds: int = Field(default=900, ge=60, le=3600)
    yandex_s3_connect_timeout_seconds: float = Field(default=10.0, gt=0, le=60)
    yandex_s3_read_timeout_seconds: float = Field(default=60.0, gt=0, le=300)
    yandex_s3_max_attempts: int = Field(default=4, ge=1, le=10)

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
