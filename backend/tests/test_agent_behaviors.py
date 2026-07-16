from datetime import UTC, datetime
from uuid import uuid4

import pytest

from src.agents.base.prompt_loader import PromptLoader
from src.agents.difficulty_agent.agent import DifficultyAgent
from src.agents.shared.context import (
    AgentContext,
    GameplaySessionContext,
    LearnerProfile,
    MissionContext,
    ProgressContext,
)


class TierJumpProvider:
    async def complete(self, **_: object) -> str:
        return '{"recommended_tier":5,"adjustment":"increase","rationale":"Too large"}'


def context_at_tier(tier: int) -> AgentContext:
    return AgentContext(
        learner=LearnerProfile(student_id=uuid4(), age=9, difficulty_tier=tier),
        session=GameplaySessionContext(
            session_id=uuid4(), started_at=datetime.now(UTC), transactions_completed=3
        ),
        progress=ProgressContext(consecutive_same_skill_mistakes=3, weak_skills=["change"]),
        mission=MissionContext(),
    )


@pytest.mark.asyncio
async def test_difficulty_agent_rejects_large_tier_jump() -> None:
    agent = DifficultyAgent(TierJumpProvider(), PromptLoader(), "gpt-5.6")

    with pytest.raises(ValueError, match="one tier"):
        await agent.run(context_at_tier(2))


def test_tutor_prompt_requires_hint_before_answer() -> None:
    prompt = PromptLoader().load("tutor")

    assert "three consecutive mistakes" in prompt.content
    assert "never the final number" in prompt.content


def test_reward_prompt_values_improvement_and_persistence() -> None:
    prompt = PromptLoader().load("reward")

    assert "persistence" in prompt.content
    assert "perfection" in prompt.content
