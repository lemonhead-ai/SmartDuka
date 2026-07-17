import logging
from datetime import UTC, datetime, timedelta
from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from src.agents.shared.context import (
    AgentContext,
    GameplaySessionContext,
    LearnerProfile,
    MissionContext,
    ProgressContext,
)
from src.agents.shared.outputs import CustomerAgentOutput, CustomerScenarioOutput
from src.contracts.sync import (
    CachedScenarioResponse,
    SyncConflictResponse,
    MissionSnapshot,
    SyncBootstrapRequest,
    SyncUploadRequest,
    SyncUploadResponse,
)
from src.database.models import InventoryItem, Student
from src.database.repositories.gameplay import GameplayRepository
from src.core.exceptions import ApplicationError
from src.services.ai.orchestrator import AIOrchestrator
from src.services.gameplay.managers import ShopInventoryManager

logger = logging.getLogger(__name__)


class SyncService:
    """Creates offline customer batches with one model request per cache refill."""

    def __init__(self, session: AsyncSession, orchestrator: AIOrchestrator | None) -> None:
        self.session = session
        self.repository = GameplayRepository(session)
        self.orchestrator = orchestrator

    async def bootstrap(self, request: SyncBootstrapRequest) -> SyncUploadResponse:
        student = await self._student()
        return await self._response(student, [], request)

    async def upload(self, request: SyncUploadRequest) -> SyncUploadResponse:
        student = await self._student()
        accepted_ids: list[str] = []
        conflicts: list[SyncConflictResponse] = []
        for event in request.events:
            conflict = self._event_conflict(event.type, event.payload)
            if conflict is not None:
                conflicts.append(SyncConflictResponse(eventId=event.id, reason=conflict))
                continue
            accepted = await self.repository.record_offline_event(
                event_id=event.id,
                student_id=student.id,
                event_type=event.type,
                payload=event.payload,
                occurred_at=datetime.fromtimestamp(event.created_at / 1000, tz=UTC),
            )
            # An event that reached the server before is also safely acknowledged.
            # This makes client retries idempotent after an interrupted response.
            accepted_ids.append(event.id)
            if accepted:
                await self._apply_event(student, event.type, event.payload)
        await self.session.commit()
        return await self._response(student, accepted_ids, request, conflicts)

    async def _student(self) -> Student:
        student = await self.repository.get_demo_student()
        if student is None:
            raise ApplicationError("The demo learner is unavailable.", status_code=503)
        return student

    async def _apply_event(self, student: Student, event_type: str, payload: dict[str, object]) -> None:
        if event_type != "transaction_completed" or payload.get("source") != "offline":
            return
        correct = bool(payload.get("correct", True))
        await self.repository.increment_progress(student.id, correct)

    async def _response(
        self,
        student: Student,
        accepted_ids: list[str],
        request: SyncBootstrapRequest,
        conflicts: list[SyncConflictResponse] | None = None,
    ) -> SyncUploadResponse:
        inventory = [item for _, item in await self.repository.list_shop_stock(student.id)]
        if not inventory:
            raise ApplicationError("The duka inventory is unavailable.", status_code=503)
        progress = await self.repository.get_progress(student.id)
        customers = await self._generate_customer_batch(
            student,
            inventory,
            progress.questions_attempted if progress else 0,
            progress.questions_correct if progress else 0,
        )
        now = datetime.now(UTC)
        scenarios = self._scenarios(student, inventory, customers, now)
        mission = MissionSnapshot(
            title="Helpful Shopkeeper",
            briefing="Serve three customers carefully and kindly.",
            target_value=3,
        )
        return SyncUploadResponse(
            accepted_event_ids=accepted_ids,
            conflicts=conflicts or [],
            scenarios=scenarios,
            missions=[mission],
            tutor=None,
            synced_at=now,
        )

    @staticmethod
    def _event_conflict(event_type: str, payload: dict[str, object]) -> str | None:
        if event_type != "transaction_completed":
            return None
        if payload.get("source") == "offline" and not isinstance(payload.get("scenarioId"), str):
            return "An offline completed sale must include its cached scenario ID."
        if payload.get("source") == "live" and not isinstance(payload.get("sessionId"), str):
            return "A live completed sale must include its gameplay session ID."
        return None

    async def _generate_customer_batch(
        self, student: Student, inventory: list[InventoryItem], attempts: int, correct: int
    ) -> CustomerAgentOutput:
        if self.orchestrator is None:
            raise ApplicationError("AI sync is unavailable. Configure the Featherless provider and try again.", status_code=503)
        try:
            return await self.orchestrator.generate_customer_batch(AgentContext(
                learner=LearnerProfile(student_id=student.id, age=student.age, language="en", difficulty_tier=student.difficulty_tier),
                session=GameplaySessionContext(session_id=uuid4(), started_at=datetime.now(UTC), transactions_completed=attempts),
                progress=ProgressContext(attempts=attempts, correct_attempts=correct),
                mission=MissionContext(progress_value=0, target_value=3, mission_type="sales"),
                available_goods=[item.name for item in inventory],
            ))
        except Exception as error:
            logger.exception("AI customer batch failed")
            raise ApplicationError(
                "AI scenario generation failed. Check the server logs, model credentials, and agent response.",
                status_code=502,
            ) from error

    def _scenarios(
        self, student: Student, inventory: list[InventoryItem], customers: CustomerAgentOutput, now: datetime
    ) -> list[CachedScenarioResponse]:
        by_name = {item.name.casefold(): item for item in inventory}
        generated = customers.scenarios
        valid = [scenario for scenario in generated if self._valid_scenario(scenario, by_name)]
        if len(valid) != 5:
            raise ApplicationError(
                "Customer Agent returned scenarios that do not match the approved inventory or payment rules.",
                status_code=502,
            )
        return [self._to_cached(student, scenario, by_name, now) for scenario in valid]

    @staticmethod
    def _valid_scenario(scenario: CustomerScenarioOutput, by_name: dict[str, InventoryItem]) -> bool:
        total = sum(
            ShopInventoryManager.price(by_name[item.item_name.casefold()]) * item.quantity
            for item in scenario.shopping_list
            if item.item_name.casefold() in by_name
        )
        return len(scenario.shopping_list) > 0 and all(
            item.item_name.casefold() in by_name for item in scenario.shopping_list
        ) and scenario.payment_amount_kes >= total

    @staticmethod
    def _to_cached(
        student: Student, scenario: CustomerScenarioOutput, by_name: dict[str, InventoryItem], now: datetime
    ) -> CachedScenarioResponse:
        items = [
            {"id": str(item.id), "name": item.name, "quantity": order.quantity, "unitPriceKes": ShopInventoryManager.price(item)}
            for order in scenario.shopping_list
            if (item := by_name.get(order.item_name.casefold()))
        ]
        request = ", ".join(f"{item['quantity']} × {item['name']}" for item in items)
        return CachedScenarioResponse(
            id=str(uuid4()), child_id=str(student.id), title="Customer at the counter",
            customer_name=scenario.customer_name,
            customer_mood="rushed" if scenario.mood == "rushed" else "curious" if scenario.mood == "curious" else "calm",
            difficulty_tier=student.difficulty_tier,
            payload={"greeting": scenario.dialogue, "shoppingRequest": request, "items": items, "paymentAmountKes": scenario.payment_amount_kes},
            cached_at=int(now.timestamp() * 1000), expires_at=int((now + timedelta(days=7)).timestamp() * 1000),
        )
