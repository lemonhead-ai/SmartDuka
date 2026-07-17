from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient

from src.core.config import Settings
from src.main import create_application
from src.services.gameplay.managers import (
    AchievementEngine,
    BasketValidationManager,
    MathChallengeManager,
    MissionProgressEngine,
    ScoringEngine,
    XpCoinsEngine,
)


def test_scoring_rewards_missions_and_achievements_reward_persistence() -> None:
    challenge = {"amount_paid_kes": 200, "total_kes": 170, "answer": 30}
    assert "Not quite" in ScoringEngine().feedback(False, 1, challenge)
    assert "KES 30" in ScoringEngine().feedback(True, 1, challenge)
    perfect = XpCoinsEngine().reward(True, attempts=1, hints=0)
    persistent = XpCoinsEngine().reward(True, attempts=2, hints=1)
    assert perfect[0] > persistent[0] > 0
    assert MissionProgressEngine().progress(3)["completed"] is True
    assert "First Sale" in AchievementEngine().update(1, True, 0, [])


def test_basket_validation_identifies_missing_unexpected_and_wrong_quantities() -> None:
    customer = {
        "name": "Mama Asha",
        "requested_items": [
            {"item_id": "banana", "name": "Banana", "quantity": 2},
            {"item_id": "mango", "name": "Mango", "quantity": 1},
        ],
    }
    selected = [{"item_id": "milk", "name": "Milk", "quantity": 1}]
    result = BasketValidationManager().validate(customer, selected)
    assert result["is_valid"] is False
    assert result["missing_items"]
    assert result["unexpected_items"]
    assert "milk" in str(result["tutor_feedback"]).lower()


def test_checkout_challenges_progress_from_change_to_multiplication_discount_and_division() -> None:
    manager = MathChallengeManager()
    lines = [
        {"name": "Banana", "quantity": 2, "price_kes": 10},
        {"name": "Milk", "quantity": 1, "price_kes": 60},
    ]

    assert manager.create_checkout_challenge(80, tier=2, basket_lines=lines)["skill"] == "change"
    multiplication = manager.create_checkout_challenge(80, tier=3, basket_lines=lines)
    assert multiplication["skill"] == "multiplication"
    assert multiplication["answer"] == 20
    discount = manager.create_checkout_challenge(80, tier=4, basket_lines=lines)
    assert discount["skill"] == "discount"
    assert discount["discount_kes"] == 8
    division = manager.create_checkout_challenge(80, tier=5, basket_lines=lines)
    assert division["skill"] == "division"
    assert division["answer"] == 40


@pytest.mark.asyncio
async def test_complete_gameplay_loop_and_progress(tmp_path: Path) -> None:
    database_path = tmp_path / "gameplay.db"
    app = create_application(
        Settings(
            database_url=f"sqlite+aiosqlite:///{database_path.as_posix()}",
            featherless_api_key=None,
        )
    )

    async with app.router.lifespan_context(app):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            started = await client.post("/api/v1/gameplay/sessions")
            assert started.status_code == 201
            session_id = started.json()["session_id"]

            customer = await client.post(f"/api/v1/gameplay/sessions/{session_id}/customers/next")
            assert customer.status_code == 200
            customer_payload = customer.json()["customer"]
            assert customer_payload["personality"] == "friendly"

            inventory = await client.get(f"/api/v1/gameplay/sessions/{session_id}/inventory")
            assert inventory.status_code == 200
            inventory_by_id = {item["id"]: item for item in inventory.json()}
            for requested_item in customer_payload["requested_items"]:
                for _ in range(requested_item["quantity"]):
                    added = await client.post(
                        f"/api/v1/gameplay/sessions/{session_id}/basket/items",
                        json={"item_id": requested_item["item_id"], "quantity": 1},
                    )
                    assert added.status_code == 200
            assert added.json()["validation"]["is_valid"] is True
            assert added.json()["total_kes"] == sum(
                inventory_by_id[item["item_id"]]["price_kes"] * item["quantity"]
                for item in customer_payload["requested_items"]
            )

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

            ledger = await client.get("/api/v1/shop/ledger")
            assert ledger.status_code == 200
            assert ledger.json()["daily_revenue_kes"] > 0
            assert ledger.json()["sales_count"] == 1
            assert ledger.json()["cash_balance_kes"] > 500

            summary = await client.get(f"/api/v1/gameplay/sessions/{session_id}/summary")
            assert summary.status_code == 200
            assert summary.json()["customers_served"] == 1
            assert summary.json()["questions_attempted"] == 1

            progress = await client.get("/api/v1/gameplay/progress")
            assert progress.status_code == 200
            assert progress.json()["questions_attempted"] == 1
            assert progress.json()["hints_used"] == 1


@pytest.mark.asyncio
async def test_restock_records_an_expense_and_protects_the_duka_cash_balance(tmp_path: Path) -> None:
    database_path = tmp_path / "ledger.db"
    app = create_application(
        Settings(
            database_url=f"sqlite+aiosqlite:///{database_path.as_posix()}",
            featherless_api_key=None,
        )
    )

    async with app.router.lifespan_context(app):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            shop = await client.get("/api/v1/shop")
            assert shop.status_code == 200
            item = shop.json()["items"][0]
            cash_before = shop.json()["cash_balance_kes"]

            restocked = await client.post(
                "/api/v1/shop/restock", json={"item_id": item["id"], "quantity": 2}
            )
            assert restocked.status_code == 200
            assert restocked.json()["cash_balance_kes"] == cash_before - item["restock_cost_kes"] * 2

            ledger = await client.get("/api/v1/shop/ledger")
            assert ledger.status_code == 200
            assert ledger.json()["daily_expenses_kes"] == item["restock_cost_kes"] * 2
            assert ledger.json()["recent_entries"][0]["entry_type"] == "restock"


@pytest.mark.asyncio
async def test_gameplay_rejects_next_customer_until_checkout(tmp_path: Path) -> None:
    database_path = tmp_path / "queue.db"
    app = create_application(
        Settings(
            database_url=f"sqlite+aiosqlite:///{database_path.as_posix()}",
            featherless_api_key=None,
        )
    )

    async with app.router.lifespan_context(app):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            session_id = (await client.post("/api/v1/gameplay/sessions")).json()["session_id"]
            assert (
                await client.post(f"/api/v1/gameplay/sessions/{session_id}/customers/next")
            ).status_code == 200
            blocked = await client.post(f"/api/v1/gameplay/sessions/{session_id}/customers/next")
            assert blocked.status_code == 409


@pytest.mark.asyncio
async def test_checkout_blocks_a_basket_that_does_not_match_request(tmp_path: Path) -> None:
    database_path = tmp_path / "validation.db"
    app = create_application(
        Settings(
            database_url=f"sqlite+aiosqlite:///{database_path.as_posix()}",
            featherless_api_key=None,
        )
    )

    async with app.router.lifespan_context(app):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            session_id = (await client.post("/api/v1/gameplay/sessions")).json()["session_id"]
            customer = await client.post(f"/api/v1/gameplay/sessions/{session_id}/customers/next")
            requested_ids = {
                item["item_id"] for item in customer.json()["customer"]["requested_items"]
            }
            inventory = await client.get(f"/api/v1/gameplay/sessions/{session_id}/inventory")
            unexpected_item = next(
                item for item in inventory.json() if item["id"] not in requested_ids
            )
            basket = await client.post(
                f"/api/v1/gameplay/sessions/{session_id}/basket/items",
                json={"item_id": unexpected_item["id"], "quantity": 1},
            )
            assert basket.json()["validation"]["is_valid"] is False
            blocked_checkout = await client.post(f"/api/v1/gameplay/sessions/{session_id}/checkout")
            assert blocked_checkout.status_code == 409
            assert "Almost!" in blocked_checkout.json()["detail"]
