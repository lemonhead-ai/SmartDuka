from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient

from src.core.config import Settings
from src.main import create_application
from src.services.gameplay.managers import (
    AchievementEngine,
    MissionProgressEngine,
    ScoringEngine,
    XpCoinsEngine,
)


def test_scoring_rewards_missions_and_achievements_reward_persistence() -> None:
    assert "Nice try" in ScoringEngine().feedback(False, 1)
    perfect = XpCoinsEngine().reward(True, attempts=1, hints=0)
    persistent = XpCoinsEngine().reward(True, attempts=2, hints=1)
    assert perfect[0] > persistent[0] > 0
    assert MissionProgressEngine().progress(3)["completed"] is True
    assert "First Sale" in AchievementEngine().update(1, True, 0, [])


@pytest.mark.asyncio
async def test_complete_gameplay_loop_and_progress(tmp_path: Path) -> None:
    database_path = tmp_path / "gameplay.db"
    app = create_application(
        Settings(database_url=f"sqlite+aiosqlite:///{database_path.as_posix()}")
    )

    async with app.router.lifespan_context(app):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            started = await client.post("/api/v1/gameplay/sessions/start")
            assert started.status_code == 201
            session_id = started.json()["session_id"]

            customer = await client.post(f"/api/v1/gameplay/sessions/{session_id}/customers/next")
            assert customer.status_code == 200
            assert customer.json()["customer"]["personality"] == "friendly"

            inventory = await client.get(f"/api/v1/gameplay/sessions/{session_id}/inventory")
            assert inventory.status_code == 200
            first_item = inventory.json()[0]
            added = await client.post(
                f"/api/v1/gameplay/sessions/{session_id}/basket/items",
                json={"item_id": first_item["id"], "quantity": 2},
            )
            assert added.status_code == 200
            assert added.json()["total_kes"] == first_item["price_kes"] * 2

            checkout = await client.post(f"/api/v1/gameplay/sessions/{session_id}/checkout")
            assert checkout.status_code == 200
            challenge = checkout.json()["challenge"]
            assert checkout.json()["status"] == "challenge_required"

            hinted = await client.post(f"/api/v1/gameplay/sessions/{session_id}/hint")
            assert hinted.status_code == 200
            assert hinted.json()["hints_used"] == 1

            prompt = challenge["prompt"]
            numbers = [
                int(value.rstrip(".?")) for value in prompt.split() if value.rstrip(".?").isdigit()
            ]
            answer = numbers[-1] - numbers[-2] if challenge["skill"] == "change" else numbers[-1]
            result = await client.post(
                f"/api/v1/gameplay/sessions/{session_id}/challenge/answer", json={"answer": answer}
            )
            assert result.status_code == 200
            assert result.json()["is_correct"] is True

            completed = await client.post(f"/api/v1/gameplay/sessions/{session_id}/checkout")
            assert completed.status_code == 200
            assert completed.json()["status"] == "completed"

            summary = await client.get(f"/api/v1/gameplay/sessions/{session_id}/summary")
            assert summary.status_code == 200
            assert summary.json()["customers_served"] == 1
            assert summary.json()["questions_attempted"] == 1

            progress = await client.get("/api/v1/gameplay/player-progress")
            assert progress.status_code == 200
            assert progress.json()["questions_attempted"] == 1
            assert progress.json()["hints_used"] == 1


@pytest.mark.asyncio
async def test_gameplay_rejects_next_customer_until_checkout(tmp_path: Path) -> None:
    database_path = tmp_path / "queue.db"
    app = create_application(
        Settings(database_url=f"sqlite+aiosqlite:///{database_path.as_posix()}")
    )

    async with app.router.lifespan_context(app):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            session_id = (await client.post("/api/v1/gameplay/sessions/start")).json()["session_id"]
            assert (
                await client.post(f"/api/v1/gameplay/sessions/{session_id}/customers/next")
            ).status_code == 200
            blocked = await client.post(f"/api/v1/gameplay/sessions/{session_id}/customers/next")
            assert blocked.status_code == 409
