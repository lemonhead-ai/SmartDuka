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
from src.contracts.sync import (
    CachedScenarioResponse,
    MissionSnapshot,
    SyncUploadRequest,
    SyncUploadResponse,
)
from src.database.repositories.gameplay import GameplayRepository
from src.services.ai.orchestrator import AIOrchestrator
from src.services.gameplay.managers import ShopInventoryManager

logger = logging.getLogger(__name__)


class SyncService:
    """Turns offline events into the next small cache of playable content."""

    def __init__(self, session: AsyncSession, orchestrator: AIOrchestrator | None) -> None:
        self.repository = GameplayRepository(session)
        self.orchestrator = orchestrator

    async def upload(self, request: SyncUploadRequest) -> SyncUploadResponse:
        student = await self.repository.get_demo_student()
        if student is None:
            raise RuntimeError("The demo learner is unavailable.")

        progress = await self.repository.get_progress(student.id)
        attempts = progress.questions_attempted if progress else 0
        correct = progress.questions_correct if progress else 0
        workflow = None
        if self.orchestrator:
            try:
                workflow = await self.orchestrator.run_session_workflow(
                    AgentContext(
                        learner=LearnerProfile(
                            student_id=student.id,
                            age=student.age,
                            language=student.language,
                            difficulty_tier=student.difficulty_tier,
                        ),
                        session=GameplaySessionContext(
                            session_id=uuid4(), started_at=datetime.now(UTC), transactions_completed=0
                        ),
                        progress=ProgressContext(attempts=attempts, correct_attempts=correct),
                        mission=MissionContext(progress_value=0, target_value=3, mission_type="sales"),
                    )
                )
            except Exception:
                logger.exception("Sync AI batch failed; returning local-safe content")

        now = datetime.now(UTC)
        customer = workflow.customer if workflow else None
        mission = workflow.mission if workflow else None
        names = [customer.customer_name] if customer else []
        names.extend(name for name in ("Amina", "Kamau", "Wanjiku", "Otieno", "Fatuma") if name not in names)
        inventory = await self.repository.list_inventory()
        scenarios = [
            CachedScenarioResponse(
                id=str(uuid4()),
                child_id=str(student.id),
                title="Customer at the counter",
                customer_name=name,
                customer_mood=(
                    "rushed" if customer and customer.mood == "rushed" else
                    "curious" if customer and customer.mood == "curious" else "calm"
                ),
                difficulty_tier=student.difficulty_tier,
                payload={
                    "greeting": customer.dialogue if customer and index == 0 else f"Jambo! I need {item.name}.",
                    "shoppingRequest": customer.shopping_request if customer and index == 0 else f"1 × {item.name}",
                    "items": [{"id": str(item.id), "name": item.name, "quantity": 1, "unitPriceKes": ShopInventoryManager.price(item)}],
                },
                cached_at=int(now.timestamp() * 1000),
                expires_at=int((now + timedelta(days=7)).timestamp() * 1000),
            )
            for index, (name, item) in enumerate(zip(names, inventory, strict=False))
        ]
        missions = [
            MissionSnapshot(
                title=mission.title if mission else "Serve your neighbours",
                briefing=mission.briefing if mission else "Help three customers with care today.",
                target_value=mission.target_value if mission else 3,
            )
        ]
        return SyncUploadResponse(
            accepted_event_ids=[event.id for event in request.events],
            scenarios=scenarios,
            missions=missions,
            synced_at=now,
        )
