import asyncio
import json
import logging
import time
from collections.abc import Awaitable
from typing import Any

from src.agents.shared.context import AgentContext
from src.agents.shared.outputs import (
    CustomerAgentOutput,
    CustomerChatOutput,
    StockOfferDecisionOutput,
    TutorAgentOutput,
)


class AIOrchestrator:
    """Coordinates independent agents without allowing agent-to-agent calls."""

    def __init__(self, agents: object, request_timeout_seconds: float = 10.0) -> None:
        self.agents = agents
        self.request_timeout_seconds = request_timeout_seconds
        self.logger = logging.getLogger(__name__)

    async def _within_deadline(self, operation: Awaitable[Any]) -> Any:
        start_time = time.time()
        try:
            if self.request_timeout_seconds and self.request_timeout_seconds > 0:
                result = await asyncio.wait_for(operation, timeout=self.request_timeout_seconds)
            else:
                result = await operation
            duration = time.time() - start_time
            self.logger.info("AI operation completed successfully in %.2fs", duration)
            return result
        except TimeoutError:
            duration = time.time() - start_time
            self.logger.warning("AI operation timed out after %.2fs (limit was %.1fs)", duration, self.request_timeout_seconds)
            raise

    async def cloud_readiness(self) -> None:
        """Verify the configured provider can return the compact JSON the game needs.

        This deliberately uses no learner, shop, or gameplay data.
        """
        customer_agent = self.agents.customer
        raw_output = await self._within_deadline(
            customer_agent.provider.complete(
                system_prompt='Reply only with this JSON object: {"status":"ready"}.',
                user_prompt="Run the SmartDuka cloud readiness check.",
                model=customer_agent.model,
                temperature=0,
                max_output_tokens=20,
            )
        )
        try:
            response = json.loads(raw_output.strip().removeprefix("```json").removesuffix("```").strip())
        except json.JSONDecodeError as error:
            raise ValueError("Cloud AI readiness check returned invalid JSON.") from error
        if response != {"status": "ready"}:
            raise ValueError("Cloud AI readiness check returned an unexpected response.")

    async def generate_customer_batch(self, context: AgentContext) -> CustomerAgentOutput:
        """Generate a reusable batch; this is the only inference needed for new customers."""
        return await self._within_deadline(self.agents.customer.run(context))

    async def tutor(self, context: AgentContext) -> TutorAgentOutput:
        """Provide a focused intervention only when the learner explicitly needs help."""
        return await self._within_deadline(self.agents.tutor.run(context))

    async def resolve_stock_offer(self, context: AgentContext) -> StockOfferDecisionOutput:
        return await self._within_deadline(self.agents.stock_offer.run(context))

    async def chat_with_customer(self, context: AgentContext) -> CustomerChatOutput:
        return await self._within_deadline(self.agents.customer_chat.run(context))
