import asyncio

from pydantic import BaseModel

from src.agents.shared.context import AgentContext
from src.agents.shared.outputs import (
    CustomerAgentOutput,
    MissionAgentOutput,
    TutorAgentOutput,
)


class AgentWorkflowResult(BaseModel):
    customer: CustomerAgentOutput | None = None
    tutor: TutorAgentOutput | None = None
    mission: MissionAgentOutput | None = None


class AIOrchestrator:
    """Coordinates independent agents without allowing agent-to-agent calls."""

    def __init__(self, agents: object) -> None:
        self.agents = agents

    async def run_session_workflow(self, context: AgentContext) -> AgentWorkflowResult:
        # Run only the 3 core agents in a single batch
        results = await asyncio.gather(
            self.agents.customer.run(context),
            self.agents.tutor.run(context),
            self.agents.mission.run(context),
            return_exceptions=True,
        )
        return AgentWorkflowResult(
            customer=results[0] if isinstance(results[0], CustomerAgentOutput) else None,
            tutor=results[1] if isinstance(results[1], TutorAgentOutput) else None,
            mission=results[2] if isinstance(results[2], MissionAgentOutput) else None,
        )
