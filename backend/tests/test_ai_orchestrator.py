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
    DifficultyAgentOutput,
    InsightAgentOutput,
    LocalizationAgentOutput,
    MissionAgentOutput,
    RewardAgentOutput,
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
        difficulty=FixedAgent(
            DifficultyAgentOutput(recommended_tier=2, adjustment="stay", rationale="Stable")
        ),
        mission=FixedAgent(
            MissionAgentOutput(
                title="Serve",
                briefing="Serve one",
                goal_description="Serve one customer",
                target_value=1,
            )
        ),
        reward=FixedAgent(
            RewardAgentOutput(
                reward_type="duka_coins",
                amount=10,
                reason="Careful retry",
                celebration_message="Well done",
            )
        ),
        insight=FixedAgent(
            InsightAgentOutput(
                summary="Progress", recommended_action="Practise", strength="Persistence"
            )
        ),
        localization=FixedAgent(
            LocalizationAgentOutput(localized_text="Habari", culturally_valid=True, language="sw")
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

    assert result.difficulty.recommended_tier == 2
    assert result.localization.culturally_valid is True
    assert result.tutor.reveal_answer is False
