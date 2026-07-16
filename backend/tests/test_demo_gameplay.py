from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient

from src.core.config import Settings
from src.main import create_application


@pytest.mark.asyncio
async def test_demo_gameplay_persists_answer_and_progress(tmp_path: Path) -> None:
    database_path = tmp_path / "demo.db"
    settings = Settings(database_url=f"sqlite+aiosqlite:///{database_path.as_posix()}")
    app = create_application(settings)

    async with app.router.lifespan_context(app):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            session_response = await client.post("/api/v1/gameplay/sessions")
            assert session_response.status_code == 201
            session_id = session_response.json()["session_id"]

            question_response = await client.get(f"/api/v1/gameplay/sessions/{session_id}/question")
            assert question_response.status_code == 200
            question = question_response.json()["question"]
            assert question is not None
            expected_answers = {"addition": 60, "change": 35, "multiplication": 30}

            answer_response = await client.post(
                f"/api/v1/gameplay/sessions/{session_id}/questions/{question['id']}/answer",
                json={"answer": expected_answers[question["skill"]]},
            )
            assert answer_response.status_code == 200
            assert answer_response.json()["is_correct"] is True

            progress_response = await client.get("/api/v1/gameplay/progress")
            assert progress_response.status_code == 200
            assert progress_response.json()["questions_attempted"] == 1
            assert progress_response.json()["questions_correct"] == 1
