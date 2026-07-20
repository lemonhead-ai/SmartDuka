from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm.attributes import flag_modified

from src.database.models import (
    GameSession,
    InventoryItem,
    OfflineEvent,
    Question,
    QuestionAttempt,
    Shop,
    ShopLedgerEntry,
    ShopStock,
    Student,
    StudentProgress,
)


class GameplayRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_demo_student(self) -> Student | None:
        return await self.session.scalar(select(Student).where(Student.is_demo.is_(True)))

    async def get_student_for_shopkeeper(self, shopkeeper_id: UUID) -> Student | None:
        return await self.session.scalar(
            select(Student).where(
                Student.shopkeeper_id == shopkeeper_id, Student.is_demo.is_(False)
            )
        )

    async def create_session(
        self, student_id: UUID, game_state: dict[str, object] | None = None
    ) -> GameSession:
        game_session = GameSession(student_id=student_id, game_state=game_state or {})
        self.session.add(game_session)
        await self.session.flush()
        return game_session

    async def save_game_state(self, game_session: GameSession, state: dict[str, object]) -> None:
        from sqlalchemy import update

        await self.session.execute(
            update(GameSession).where(GameSession.id == game_session.id).values(game_state=state)
        )
        game_session.game_state = state
        flag_modified(game_session, "game_state")

    async def list_inventory(self) -> list[InventoryItem]:
        result = await self.session.scalars(
            select(InventoryItem)
            .where(InventoryItem.is_active.is_(True), InventoryItem.stock > 0)
            .order_by(InventoryItem.category, InventoryItem.name)
        )
        return list(result)

    async def get_shop(self, student_id: UUID) -> Shop | None:
        return await self.session.scalar(select(Shop).where(Shop.student_id == student_id))

    async def create_shop(
        self, student_id: UUID, name: str, category: str, item_ids: list[UUID]
    ) -> Shop:
        shop = Shop(student_id=student_id, name=name, category=category)
        self.session.add(shop)
        await self.session.flush()
        self.session.add_all(
            [
                ShopStock(shop_id=shop.id, inventory_item_id=item_id, stock=12)
                for item_id in item_ids
            ]
        )
        await self.session.flush()
        return shop

    async def add_shop_items(
        self, shop: Shop, item_ids: list[UUID], initial_stock: int
    ) -> list[ShopStock]:
        existing = await self.session.scalars(
            select(ShopStock.inventory_item_id).where(ShopStock.shop_id == shop.id)
        )
        existing_ids = set(existing)
        new_ids = [item_id for item_id in item_ids if item_id not in existing_ids]
        if not new_ids:
            return []
        items = list(
            await self.session.scalars(select(InventoryItem).where(InventoryItem.id.in_(new_ids)))
        )
        restock_cost = sum(item.supplier_cost_kes * initial_stock for item in items)
        if shop.cash_balance_kes < restock_cost:
            raise ValueError("Your duka does not have enough cash for those products.")
        stock_rows = [
            ShopStock(shop_id=shop.id, inventory_item_id=item_id, stock=initial_stock)
            for item_id in new_ids
        ]
        self.session.add_all(stock_rows)
        shop.cash_balance_kes -= restock_cost
        self.session.add_all(
            [
                ShopLedgerEntry(
                    shop_id=shop.id,
                    entry_type="new_stock",
                    amount_kes=-(item.supplier_cost_kes * initial_stock),
                    description=f"Added {initial_stock} {item.name.lower()} to the shelf",
                )
                for item in items
            ]
        )
        await self.session.flush()
        return stock_rows

    async def restock_shop_item(
        self, student_id: UUID, item_id: UUID, quantity: int
    ) -> ShopStock | None:
        shop = await self.get_shop(student_id)
        if shop is None:
            return None
        stock = await self.get_shop_stock(student_id, item_id)
        if stock is None:
            return None
        item = await self.get_inventory_item(item_id)
        if item is None:
            return None
        restock_cost = item.supplier_cost_kes * quantity
        if shop.cash_balance_kes < restock_cost:
            raise ValueError(
                f"You need KES {restock_cost} to restock {quantity} {item.name.lower()}."
            )
        stock.stock += quantity
        shop.cash_balance_kes -= restock_cost
        self.session.add(
            ShopLedgerEntry(
                shop_id=shop.id,
                entry_type="restock",
                amount_kes=-restock_cost,
                description=f"Restocked {quantity} {item.name.lower()}",
            )
        )
        await self.session.flush()
        return stock

    async def record_sale(self, student_id: UUID, total_kes: int, customer_name: str) -> None:
        shop = await self.get_shop(student_id)
        if shop is None:
            raise ValueError("A duka is required to record a sale.")
        shop.cash_balance_kes += total_kes
        self.session.add(
            ShopLedgerEntry(
                shop_id=shop.id,
                entry_type="sale",
                amount_kes=total_kes,
                description=f"Sale to {customer_name}",
            )
        )
        await self.session.flush()

    async def list_ledger_entries(self, shop_id: UUID, limit: int = 8) -> list[ShopLedgerEntry]:
        entries = await self.session.scalars(
            select(ShopLedgerEntry)
            .where(ShopLedgerEntry.shop_id == shop_id)
            .order_by(ShopLedgerEntry.created_at.desc())
            .limit(limit)
        )
        return list(entries)

    async def daily_ledger_entries(self, shop_id: UUID) -> list[ShopLedgerEntry]:
        day_start = datetime.now(UTC).replace(hour=0, minute=0, second=0, microsecond=0)
        entries = await self.session.scalars(
            select(ShopLedgerEntry).where(
                ShopLedgerEntry.shop_id == shop_id,
                ShopLedgerEntry.created_at >= day_start,
            )
        )
        return list(entries)

    async def list_shop_stock(self, student_id: UUID) -> list[tuple[ShopStock, InventoryItem]]:
        result = await self.session.execute(
            select(ShopStock, InventoryItem)
            .join(Shop, ShopStock.shop_id == Shop.id)
            .join(InventoryItem, ShopStock.inventory_item_id == InventoryItem.id)
            .where(
                Shop.student_id == student_id,
                ShopStock.stock > 0,
                InventoryItem.is_active.is_(True),
            )
            .order_by(InventoryItem.name)
        )
        return list(result.tuples())

    async def list_all_shop_stock(self, student_id: UUID) -> list[tuple[ShopStock, InventoryItem]]:
        result = await self.session.execute(
            select(ShopStock, InventoryItem)
            .join(Shop, ShopStock.shop_id == Shop.id)
            .join(InventoryItem, ShopStock.inventory_item_id == InventoryItem.id)
            .where(
                Shop.student_id == student_id,
                InventoryItem.is_active.is_(True),
            )
            .order_by(InventoryItem.name)
        )
        return list(result.tuples())

    async def get_shop_stock(self, student_id: UUID, item_id: UUID) -> ShopStock | None:
        return await self.session.scalar(
            select(ShopStock)
            .join(Shop, ShopStock.shop_id == Shop.id)
            .where(Shop.student_id == student_id, ShopStock.inventory_item_id == item_id)
        )

    async def get_inventory_item(self, item_id: UUID) -> InventoryItem | None:
        return await self.session.get(InventoryItem, item_id)

    async def get_active_session(self, session_id: UUID) -> GameSession | None:
        return await self.session.scalar(
            select(GameSession).where(GameSession.id == session_id, GameSession.status == "active")
        )

    async def get_next_question(self, session_id: UUID, tier: int) -> Question | None:
        answered_question_ids = select(QuestionAttempt.question_id).where(
            QuestionAttempt.session_id == session_id
        )
        question = await self.session.scalar(
            select(Question)
            .where(
                Question.is_active.is_(True),
                Question.difficulty_tier <= tier,
                Question.id.not_in(answered_question_ids),
            )
            .order_by(Question.difficulty_tier, Question.id)
        )
        return question

    async def get_question(self, question_id: UUID) -> Question | None:
        return await self.session.get(Question, question_id)

    async def has_attempt(self, session_id: UUID, question_id: UUID) -> bool:
        attempt = await self.session.scalar(
            select(QuestionAttempt.id).where(
                QuestionAttempt.session_id == session_id, QuestionAttempt.question_id == question_id
            )
        )
        return attempt is not None

    async def record_attempt(
        self, session_id: UUID, question_id: UUID, submitted_answer: int, is_correct: bool
    ) -> QuestionAttempt:
        attempt = QuestionAttempt(
            session_id=session_id,
            question_id=question_id,
            submitted_answer=submitted_answer,
            is_correct=is_correct,
        )
        self.session.add(attempt)
        await self.session.flush()
        return attempt

    async def get_progress(self, student_id: UUID) -> StudentProgress | None:
        return await self.session.get(StudentProgress, student_id)

    async def increment_progress(self, student_id: UUID, is_correct: bool) -> StudentProgress:
        progress = await self.get_progress(student_id)
        if progress is None:
            progress = StudentProgress(student_id=student_id)
            self.session.add(progress)
        progress.questions_attempted += 1
        if is_correct:
            progress.questions_correct += 1
        await self.session.flush()
        return progress

    async def record_offline_event(
        self,
        *,
        event_id: str,
        student_id: UUID,
        event_type: str,
        payload: dict[str, object],
        occurred_at: datetime,
    ) -> bool:
        existing = await self.session.scalar(
            select(OfflineEvent.id).where(OfflineEvent.event_id == event_id)
        )
        if existing is not None:
            return False
        self.session.add(
            OfflineEvent(
                event_id=event_id,
                student_id=student_id,
                event_type=event_type,
                payload=payload,
                occurred_at=occurred_at,
            )
        )
        await self.session.flush()
        return True
