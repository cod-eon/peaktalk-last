from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Database
    database_url: str

    # Supabase
    supabase_url: str
    supabase_key: str
    supabase_jwt_secret: str
    supabase_storage_bucket: str = "documents"

    # AI
    gemini_api_key: str

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # App
    app_env: str = "development"
    debug: bool = False


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
