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
            CustomerAgentOutput(customer_name="Akinyi", dialogue="Habari", item_count=1)
        ),
        tutor=FixedAgent(TutorAgentOutput(hint="Count again", focus_skill="addition")),
        difficulty=FixedAgent(DifficultyAgentOutput(recommended_tier=2, rationale="Stable")),
        mission=FixedAgent(MissionAgentOutput(title="Serve", briefing="Serve one", target_value=1)),
        reward=FixedAgent(RewardAgentOutput(reward_type="duka_coins", amount=10)),
        insight=FixedAgent(InsightAgentOutput(summary="Progress", recommended_action="Practise")),
        localization=FixedAgent(
            LocalizationAgentOutput(localized_text="Habari", culturally_valid=True)
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
