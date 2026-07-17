import sqlite3
from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient

from src.core.config import Settings
from src.main import create_application


@pytest.mark.asyncio
async def test_startup_upgrades_a_legacy_demo_database_and_starts_a_session(
    tmp_path: Path,
) -> None:
    database_path = tmp_path / "legacy-demo.db"
    connection = sqlite3.connect(database_path)
    connection.executescript(
        """
        CREATE TABLE students (
            id CHAR(32) PRIMARY KEY, display_name VARCHAR(100) NOT NULL,
            age INTEGER NOT NULL, language VARCHAR(8) NOT NULL,
            difficulty_tier INTEGER NOT NULL, is_demo BOOLEAN UNIQUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE game_sessions (
            id CHAR(32) PRIMARY KEY, student_id CHAR(32) NOT NULL,
            status VARCHAR(20) NOT NULL, started_at DATETIME,
            ended_at DATETIME
        );
        CREATE TABLE student_progress (
            student_id CHAR(32) PRIMARY KEY, questions_attempted INTEGER NOT NULL DEFAULT 0,
            questions_correct INTEGER NOT NULL DEFAULT 0, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        """
    )
    connection.close()

    app = create_application(
        Settings(
            database_url=f"sqlite+aiosqlite:///{database_path.as_posix()}",
            featherless_api_key=None,
        )
    )

    async with app.router.lifespan_context(app):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post("/api/v1/gameplay/sessions")
            assert response.status_code == 201

    connection = sqlite3.connect(database_path)
    session_columns = {row[1] for row in connection.execute("PRAGMA table_info(game_sessions)")}
    progress_columns = {row[1] for row in connection.execute("PRAGMA table_info(student_progress)")}
    connection.close()
    assert "game_state" in session_columns
    assert {"coins_earned", "current_learning_level", "missions_completed"} <= progress_columns
