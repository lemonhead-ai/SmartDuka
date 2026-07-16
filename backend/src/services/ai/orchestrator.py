import asyncio

from pydantic import BaseModel

from src.agents.shared.context import AgentContext
from src.agents.shared.outputs import (
    CustomerAgentOutput,
    DifficultyAgentOutput,
    InsightAgentOutput,
    LocalizationAgentOutput,
    MissionAgentOutput,
    RewardAgentOutput,
    TutorAgentOutput,
)


class AgentWorkflowResult(BaseModel):
    customer: CustomerAgentOutput
    tutor: TutorAgentOutput
    difficulty: DifficultyAgentOutput
    mission: MissionAgentOutput
    reward: RewardAgentOutput
    insight: InsightAgentOutput
    localization: LocalizationAgentOutput


class AIOrchestrator:
    """Coordinates independent agents without allowing agent-to-agent calls."""

    def __init__(self, agents: object) -> None:
        self.agents = agents

    async def run_session_workflow(self, context: AgentContext) -> AgentWorkflowResult:
        customer = await self.agents.customer.run(context)
        tutor = await self.agents.tutor.run(context)
        difficulty = await self.agents.difficulty.run(context)
        mission = await self.agents.mission.run(context)
        reward = await self.agents.reward.run(context)
        insight = await self.agents.insight.run(context)
        localization = await self.agents.localization.run(context)
        return AgentWorkflowResult(
            customer=customer,
            tutor=tutor,
            difficulty=difficulty,
            mission=mission,
            reward=reward,
            insight=insight,
            localization=localization,
        )
