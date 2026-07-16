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
        results = await asyncio.gather(
            self.agents.customer.run(context),
            self.agents.tutor.run(context),
            self.agents.difficulty.run(context),
            self.agents.mission.run(context),
            self.agents.reward.run(context),
            self.agents.insight.run(context),
            self.agents.localization.run(context),
        )
        return AgentWorkflowResult(
            customer=results[0],
            tutor=results[1],
            difficulty=results[2],
            mission=results[3],
            reward=results[4],
            insight=results[5],
            localization=results[6],
        )
