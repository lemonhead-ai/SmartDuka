import asyncio
import logging

from pydantic import BaseModel

from src.agents.shared.context import AgentContext
from src.agents.shared.outputs import (
    CustomerAgentOutput,
    MissionAgentOutput,
    TutorAgentOutput,
)


class AgentWorkflowResult(BaseModel):
    customer: CustomerAgentOutput
    tutor: TutorAgentOutput
    mission: MissionAgentOutput


class AIOrchestrator:
    """Coordinates independent agents without allowing agent-to-agent calls."""

    def __init__(self, agents: object) -> None:
        self.agents = agents
        self.logger = logging.getLogger(__name__)

    async def run_session_workflow(self, context: AgentContext) -> AgentWorkflowResult:
        # Run only the 3 core agents in a single batch
        results = await asyncio.gather(
            self.agents.customer.run(context),
            self.agents.tutor.run(context),
            self.agents.mission.run(context),
            return_exceptions=True,
        )
        names = ("customer", "tutor", "mission")
        errors = [f"{name}: {result}" for name, result in zip(names, results) if isinstance(result, Exception)]
        if errors:
            self.logger.error("AI sync batch failed: %s", "; ".join(errors))
            raise RuntimeError("; ".join(errors))
        return AgentWorkflowResult(
            customer=results[0],  # type: ignore[arg-type]
            tutor=results[1],  # type: ignore[arg-type]
            mission=results[2],  # type: ignore[arg-type]
        )
