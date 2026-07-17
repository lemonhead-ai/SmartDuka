import logging

from src.agents.shared.context import AgentContext
from src.agents.shared.outputs import (
    CustomerAgentOutput,
    StockOfferDecisionOutput,
    TutorAgentOutput,
)


class AIOrchestrator:
    """Coordinates independent agents without allowing agent-to-agent calls."""

    def __init__(self, agents: object) -> None:
        self.agents = agents
        self.logger = logging.getLogger(__name__)

    async def generate_customer_batch(self, context: AgentContext) -> CustomerAgentOutput:
        """Generate a reusable batch; this is the only inference needed for new customers."""
        return await self.agents.customer.run(context)

    async def tutor(self, context: AgentContext) -> TutorAgentOutput:
        """Provide a focused intervention only when the learner explicitly needs help."""
        return await self.agents.tutor.run(context)

    async def resolve_stock_offer(self, context: AgentContext) -> StockOfferDecisionOutput:
        return await self.agents.stock_offer.run(context)
