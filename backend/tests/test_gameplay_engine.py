from datetime import date, timedelta
from pathlib import Path
from uuid import UUID

import pytest
from httpx import ASGITransport, AsyncClient

from src.core.config import Settings
from src.database.repositories.gameplay import GameplayRepository
from src.main import create_application
from src.services.gameplay.managers import (
    AchievementEngine,
    BasketValidationManager,
    LearningSummaryManager,
    LiteracyChallengeManager,
    MathChallengeManager,
    MissionProgressEngine,
    MotivationManager,
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


def test_daily_motivation_persists_goals_streaks_and_badges() -> None:
    manager = MotivationManager()
    today = date(2026, 7, 18)
    state = manager.start_day({}, today, seed=4)
    assert state["current_streak_days"] == 1
    mission = state["daily_mission"]
    assert isinstance(mission, dict)

    event = str(mission["kind"])
    for _ in range(int(mission["target"])):
        state, completed_now = manager.record_event(state, event)
    assert completed_now is True
    assert manager.response(state)["daily_mission"]["completed"] is True

    state, badges = manager.award_for_event(state, "sale")
    assert badges[0]["id"] == "first-sale"
    next_day = manager.start_day(state, today + timedelta(days=1), seed=4)
    assert next_day["current_streak_days"] == 2


def test_learning_summary_uses_real_attempts_and_support_signals() -> None:
    summary = LearningSummaryManager().build(
        student_name="Amina",
        questions_attempted=5,
        correct_answers=3,
        hints_used=2,
        learning_level=2,
        streak_days=2,
        badges=[{"id": "first-sale", "name": "First Sale", "description": "Completed a sale."}],
        literacy_moments_completed=1,
        skills_improving=["money", "change"],
    )
    assert summary["teacher_summary"]["accuracy_percent"] == 60
    assert "Amina" in str(summary["parent_summary"]["headline"])
    assert "Reading through customer conversations" in summary["teacher_summary"]["strengths"]


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


def test_literacy_challenges_vary_with_level_and_check_answers() -> None:
    manager = LiteracyChallengeManager()
    customer = {
        "requested_items": [
            {"item_id": "milk", "name": "Milk", "quantity": 2},
            {"item_id": "bread", "name": "Bread", "quantity": 1},
        ]
    }
    available = ["Milk", "Bread", "Juice"]

    word = manager.create(customer, tier=2, age=9, served=0, available_item_names=available)
    sentence = manager.create(customer, tier=3, age=9, served=0, available_item_names=available)
    spelling = manager.create(customer, tier=4, age=9, served=0, available_item_names=available)
    conversation = manager.create(
        customer, tier=5, age=11, served=0, available_item_names=available
    )

    assert word is not None and word["type"] == "word_reading"
    assert word["content"] == "maziwa"
    assert manager.is_correct(word, "milk")
    assert sentence is not None and sentence["type"] == "sentence_reading"
    assert "Dear shopkeeper" in str(sentence["content"])
    assert manager.is_correct(sentence, "choice-0")
    assert spelling is not None and spelling["type"] == "spelling"
    assert spelling["letter_options"]
    assert manager.is_correct(spelling, str(spelling["answer"]))
    assert conversation is not None and conversation["type"] == "conversation"
    assert manager.is_correct(conversation, "choice-0")


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
            assert started.json()["motivation"]["current_streak_days"] >= 1
            motivation = await client.get("/api/v1/gameplay/motivation")
            assert motivation.status_code == 200
            assert motivation.json()["daily_mission"]["target"] >= 1
            learning_summary = await client.get("/api/v1/gameplay/learning-summary")
            assert learning_summary.status_code == 200
            assert learning_summary.json()["student_name"] == started.json()["student_name"]

            customer = await client.post(f"/api/v1/gameplay/sessions/{session_id}/customers/next")
            assert customer.status_code == 200
            customer_payload = customer.json()["customer"]
            assert customer_payload["personality"] == "friendly"
            literacy = customer.json()["literacy_challenge"]
            assert literacy["type"] == "word_reading"
            literacy_answer = await client.post(
                f"/api/v1/gameplay/sessions/{session_id}/literacy/answer",
                json={"answer": customer_payload["requested_items"][0]["item_id"]},
            )
            assert literacy_answer.status_code == 200
            assert literacy_answer.json()["is_correct"] is True

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
            assert summary.json()["questions_attempted"] == 2

            progress = await client.get("/api/v1/gameplay/progress")
            assert progress.status_code == 200
            assert progress.json()["questions_attempted"] == 2
            assert progress.json()["hints_used"] == 1


@pytest.mark.asyncio
async def test_restock_records_an_expense_and_protects_the_duka_cash_balance(
    tmp_path: Path,
) -> None:
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
            assert (
                restocked.json()["cash_balance_kes"] == cash_before - item["restock_cost_kes"] * 2
            )

            ledger = await client.get("/api/v1/shop/ledger")
            assert ledger.status_code == 200
            assert ledger.json()["daily_expenses_kes"] == item["restock_cost_kes"] * 2
            assert ledger.json()["recent_entries"][0]["entry_type"] == "restock"


@pytest.mark.asyncio
async def test_stock_decision_persists_before_the_next_basket_validation(tmp_path: Path) -> None:
    database_path = tmp_path / "stock-decision.db"
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
            async with app.state.database.session_factory() as database_session:
                repository = GameplayRepository(database_session)
                student = await repository.get_demo_student()
                assert student is not None
                stock_rows = await repository.list_shop_stock(student.id)
                stock, item = next(row for row in stock_rows if row[1].name == "Juice")
                stock.stock = 1
                game_session = await repository.get_active_session(UUID(session_id))
                assert game_session is not None
                game_session.game_state = {
                    "current_customer": {
                        "id": "customer-1",
                        "name": "Wanjiru",
                        "personality": "friendly",
                        "greeting": "Jambo!",
                        "request": "I need 3 juice, please.",
                        "requested_items": [
                            {"item_id": str(item.id), "name": item.name, "quantity": 3}
                        ],
                        "stock_offer": {
                            "item_id": str(item.id),
                            "name": item.name,
                            "requested_quantity": 3,
                            "available_quantity": 1,
                            "status": "pending",
                            "message": "Only one juice is left.",
                        },
                    },
                    "basket": [],
                    "challenge": None,
                }
                await database_session.commit()

            resolved = await client.post(
                f"/api/v1/gameplay/sessions/{session_id}/customers/stock-offer"
            )
            assert resolved.status_code == 200
            assert resolved.json()["customer"]["requested_items"][0]["quantity"] == 1
            assert resolved.json()["customer"]["request_version"] == 1
            assert resolved.json()["basket"]["request_version"] == 1

            basket = await client.post(
                f"/api/v1/gameplay/sessions/{session_id}/basket/items",
                json={"item_id": str(item.id), "quantity": 1},
            )
            assert basket.status_code == 200
            assert basket.json()["validation"]["is_valid"] is True
            assert "exactly what Wanjiru requested" in basket.json()["validation"]["tutor_feedback"]
            assert "juice" not in basket.json()["validation"]["tutor_feedback"].lower()
            assert basket.json()["request_version"] == 1


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
