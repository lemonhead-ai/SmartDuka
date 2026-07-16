from datetime import UTC, datetime
from types import SimpleNamespace
from uuid import uuid4

import pytest

from src.agents.shared.context import (
    AgentContext,
    GameplaySessionContext,
    LearnerProfile,
    MissionContext,
    ProgressContext,
)
from src.agents.shared.outputs import (
    CustomerAgentOutput,
    MissionAgentOutput,
    TutorAgentOutput,
)
from src.services.ai.orchestrator import AIOrchestrator


class FixedAgent:
    def __init__(self, output: object) -> None:
        self.output = output

    async def run(self, _: AgentContext) -> object:
        return self.output


@pytest.mark.asyncio
async def test_orchestrator_returns_typed_parallel_workflow() -> None:
    agents = SimpleNamespace(
        customer=FixedAgent(
            CustomerAgentOutput(
                customer_name="Akinyi",
                dialogue="Habari",
                shopping_request="Chai moja",
                item_count=1,
                mood="friendly",
            )
        ),
        tutor=FixedAgent(
            TutorAgentOutput(
                hint="Count again",
                focus_skill="addition",
                encouragement="Keep trying",
            )
        ),
        mission=FixedAgent(
            MissionAgentOutput(
                title="Serve",
                briefing="Serve one",
                goal_description="Serve one customer",
                target_value=1,
            )
        ),
    )
    context = AgentContext(
        learner=LearnerProfile(student_id=uuid4(), age=9),
        session=GameplaySessionContext(
            session_id=uuid4(), started_at=datetime.now(UTC), transactions_completed=0
        ),
        progress=ProgressContext(),
        mission=MissionContext(),
    )

    result = await AIOrchestrator(agents).run_session_workflow(context)

    assert result.customer is not None
    assert result.mission is not None
    assert result.tutor is not None
    assert result.tutor.reveal_answer is False
