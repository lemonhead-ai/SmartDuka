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
from src.agents.shared.outputs import CustomerScenarioOutput
from src.contracts.sync import (
    CachedScenarioResponse,
    MissionSnapshot,
    SyncBootstrapRequest,
    SyncUploadRequest,
    SyncUploadResponse,
    TutorSnapshot,
)
from src.database.models import InventoryItem, Student
from src.database.repositories.gameplay import GameplayRepository
from src.services.ai.orchestrator import AIOrchestrator, AgentWorkflowResult
from src.services.gameplay.managers import ShopInventoryManager

logger = logging.getLogger(__name__)
FALLBACK_NAMES = ("Amina", "Kamau", "Wanjiku", "Otieno", "Fatuma")


class SyncService:
    """Creates and refills the offline cache without ever blocking play on AI."""

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
        for event in request.events:
            accepted = await self.repository.record_offline_event(
                event_id=event.id,
                student_id=student.id,
                event_type=event.type,
                payload=event.payload,
                occurred_at=datetime.fromtimestamp(event.created_at / 1000, tz=UTC),
            )
            if accepted:
                accepted_ids.append(event.id)
                await self._apply_event(student, event.type, event.payload)
        await self.session.commit()
        return await self._response(student, accepted_ids, request)

    async def _student(self) -> Student:
        student = await self.repository.get_demo_student()
        if student is None:
            raise RuntimeError("The demo learner is unavailable.")
        return student

    async def _apply_event(self, student: Student, event_type: str, payload: dict[str, object]) -> None:
        if event_type != "transaction_completed":
            return
        correct = bool(payload.get("correct", True))
        await self.repository.increment_progress(student.id, correct)

    async def _response(
        self,
        student: Student,
        accepted_ids: list[str],
        request: SyncBootstrapRequest,
    ) -> SyncUploadResponse:
        inventory = await self.repository.list_inventory()
        if not inventory:
            raise RuntimeError("The duka inventory is unavailable.")
        progress = await self.repository.get_progress(student.id)
        workflow = await self._run_agents(student, inventory, progress.questions_attempted if progress else 0, progress.questions_correct if progress else 0)
        now = datetime.now(UTC)
        scenarios = self._scenarios(student, inventory, workflow, now)
        mission = workflow.mission if workflow and workflow.mission else None
        tutor = workflow.tutor if workflow and workflow.tutor else None
        return SyncUploadResponse(
            accepted_event_ids=accepted_ids,
            scenarios=scenarios,
            missions=[MissionSnapshot(
                title=mission.title if mission else "Serve your neighbours",
                briefing=mission.briefing if mission else "Help three customers with care today.",
                target_value=mission.target_value if mission else 3,
            )],
            tutor=TutorSnapshot(
                hint=tutor.hint,
                encouragement=tutor.encouragement,
                focus_skill=tutor.focus_skill,
            ) if tutor else None,
            synced_at=now,
        )

    async def _run_agents(
        self, student: Student, inventory: list[InventoryItem], attempts: int, correct: int
    ) -> AgentWorkflowResult | None:
        if self.orchestrator is None:
            return None
        try:
            return await self.orchestrator.run_session_workflow(AgentContext(
                learner=LearnerProfile(student_id=student.id, age=student.age, language=student.language, difficulty_tier=student.difficulty_tier),
                session=GameplaySessionContext(session_id=uuid4(), started_at=datetime.now(UTC), transactions_completed=attempts),
                progress=ProgressContext(attempts=attempts, correct_attempts=correct),
                mission=MissionContext(progress_value=0, target_value=3, mission_type="sales"),
                available_goods=[item.name for item in inventory],
            ))
        except Exception:
            logger.exception("The AI sync batch failed; safe fallback content will be used")
            return None

    def _scenarios(
        self, student: Student, inventory: list[InventoryItem], workflow: AgentWorkflowResult | None, now: datetime
    ) -> list[CachedScenarioResponse]:
        by_name = {item.name.casefold(): item for item in inventory}
        generated = workflow.customer.scenarios if workflow and workflow.customer else []
        valid = [scenario for scenario in generated if self._valid_scenario(scenario, by_name)]
        while len(valid) < 5:
            item = inventory[len(valid) % len(inventory)]
            valid.append(CustomerScenarioOutput(
                customer_name=FALLBACK_NAMES[len(valid) % len(FALLBACK_NAMES)],
                dialogue=f"Jambo! I need {item.name}, please.",
                shopping_list=[{"item_name": item.name, "quantity": 1}],
                payment_amount_kes=max(100, ShopInventoryManager.price(item)),
                mood="friendly",
            ))
        return [self._to_cached(student, scenario, by_name, now) for scenario in valid[:5]]

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
