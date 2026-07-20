from src.core.config import Settings


def test_supabase_postgres_urls_use_the_async_driver_and_ssl_connect_args() -> None:
    settings = Settings(
        database_url=(
            "postgresql://postgres.project:password@aws-region.pooler.supabase.com:5432/"
            "postgres?sslmode=require"
        )
    )

    assert settings.database_url == (
        "postgresql+asyncpg://postgres.project:password@aws-region.pooler.supabase.com:5432/"
        "postgres"
    )
