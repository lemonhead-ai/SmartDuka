from functools import lru_cache
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from pydantic import Field, field_validator
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
    auth_session_cookie_name: str = "smartduka_session"
    auth_session_days: int = 14
    auth_cookie_secure: bool = False
    password_reset_minutes: int = 30

    @field_validator("database_url")
    @classmethod
    def normalize_postgres_database_url(cls, value: str) -> str:
        """Accept a Supabase Postgres URI and select SQLAlchemy's async driver."""

        if value.startswith("postgres://"):
            value = f"postgresql+asyncpg://{value.removeprefix('postgres://')}"
        elif value.startswith("postgresql://"):
            value = f"postgresql+asyncpg://{value.removeprefix('postgresql://')}"

        if not value.startswith("postgresql+asyncpg://"):
            return value

        parsed = urlsplit(value)
        query = [(key, item) for key, item in parse_qsl(parsed.query) if key != "sslmode"]
        return urlunsplit((parsed.scheme, parsed.netloc, parsed.path, urlencode(query), parsed.fragment))


@lru_cache
def get_settings() -> Settings:
    return Settings()
