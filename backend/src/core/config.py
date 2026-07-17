from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_prefix="SMARTDUKA_",
        extra="ignore",
    )

    app_name: str = "Smart Duka API"
    app_version: str = "0.1.0"
    environment: str = "development"
    debug: bool = False
    log_level: str = "INFO"
    api_v1_prefix: str = "/api/v1"
    database_url: str = "sqlite+aiosqlite:///./smartduka.db"
    llm_provider: str = "featherless"
    featherless_api_key: str | None = None
    # Featherless model remains configurable via SMARTDUKA_FEATHERLESS_MODEL.
    featherless_model: str = "Qwen/Qwen3-32B"
    featherless_base_url: str = "https://api.featherless.ai/v1"
    featherless_enable_thinking: bool = False
    openai_api_key: str | None = None
    openai_model: str = "gpt-5.6"
    allowed_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])


@lru_cache
def get_settings() -> Settings:
    return Settings()
