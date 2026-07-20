from collections.abc import AsyncIterator
import ssl

from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from src.database.base import Base


class Database:
    def __init__(self, database_url: str) -> None:
        engine_options: dict[str, object] = {"pool_pre_ping": True}
        if database_url.startswith("postgresql+asyncpg://"):
            ssl_context = ssl.create_default_context()
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE

            engine_options.update(
                pool_size=5,
                max_overflow=5,
                pool_recycle=1800,
                connect_args={"ssl": ssl_context, "statement_cache_size": 0},
            )
        self.engine: AsyncEngine = create_async_engine(database_url, **engine_options)
        self.session_factory = async_sessionmaker(self.engine, expire_on_commit=False)

    async def create_schema(self) -> None:
        async with self.engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)
            await connection.run_sync(self._apply_sqlite_demo_migrations)
            await connection.run_sync(self._secure_postgres_tables)

    @staticmethod
    def _apply_sqlite_demo_migrations(connection: Connection) -> None:
        """Apply safe, additive upgrades for existing local demo databases."""
        if connection.dialect.name != "sqlite":
            return

        table_names = set(connection.dialect.get_table_names(connection))
        additions = {
            "students": {"shopkeeper_id": "CHAR(32)"},
            "game_sessions": {"game_state": "JSON NOT NULL DEFAULT '{}'"},
            "student_progress": {
                "hints_used": "INTEGER NOT NULL DEFAULT 0",
                "time_spent_seconds": "INTEGER NOT NULL DEFAULT 0",
                "coins_earned": "INTEGER NOT NULL DEFAULT 0",
                "xp_earned": "INTEGER NOT NULL DEFAULT 0",
                "stars_earned": "INTEGER NOT NULL DEFAULT 0",
                "missions_completed": "INTEGER NOT NULL DEFAULT 0",
                "current_learning_level": "INTEGER NOT NULL DEFAULT 1",
                "literacy_moments_completed": "INTEGER NOT NULL DEFAULT 0",
                "motivation_state": "JSON NOT NULL DEFAULT '{}'",
            },
            "inventory_items": {"supplier_cost_kes": "INTEGER NOT NULL DEFAULT 0"},
            "shops": {
                "cash_balance_kes": "INTEGER NOT NULL DEFAULT 500",
                "theme": "VARCHAR(20) NOT NULL DEFAULT 'leaf'",
            },
        }
        for table_name, columns in additions.items():
            if table_name not in table_names:
                continue
            existing = {
                row[1] for row in connection.exec_driver_sql(f"PRAGMA table_info({table_name})")
            }
            for column_name, definition in columns.items():
                if column_name not in existing:
                    connection.exec_driver_sql(
                        f"ALTER TABLE {table_name} ADD COLUMN {column_name} {definition}"
                    )
        if "students" in table_names:
            connection.exec_driver_sql(
                "CREATE UNIQUE INDEX IF NOT EXISTS uq_students_shopkeeper_id "
                "ON students (shopkeeper_id) WHERE shopkeeper_id IS NOT NULL"
            )

    @staticmethod
    def _secure_postgres_tables(connection: Connection) -> None:
        """Keep ORM-managed gameplay data inaccessible through Supabase's Data API."""

        if connection.dialect.name != "postgresql":
            return
        for table in Base.metadata.sorted_tables:
            connection.exec_driver_sql(f'ALTER TABLE "{table.name}" ENABLE ROW LEVEL SECURITY')

    async def dispose(self) -> None:
        await self.engine.dispose()

    async def session(self) -> AsyncIterator[AsyncSession]:
        async with self.session_factory() as session:
            yield session
