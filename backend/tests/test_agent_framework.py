from datetime import UTC, datetime
from uuid import uuid4

import pytest

from src.agents.base.agent import StructuredAgent
from src.agents.base.prompt_loader import PromptLoader
from src.agents.shared.context import (
    AgentContext,
    GameplaySessionContext,
    LearnerProfile,
    MissionContext,
    ProgressContext,
)
from src.agents.shared.outputs import CustomerAgentOutput


class StaticProvider:
    async def complete(self, **_: object) -> str:
        return (
            '{"scenarios":[{"customer_name":"Akinyi","dialogue":"Habari!",'
            '"shopping_list":[{"item_name":"Chai","quantity":1}],"payment_amount_kes":50,"mood":"friendly"},'
            '{"customer_name":"Akinyi","dialogue":"Habari!",'
            '"shopping_list":[{"item_name":"Chai","quantity":1}],"payment_amount_kes":50,"mood":"friendly"},'
            '{"customer_name":"Akinyi","dialogue":"Habari!",'
            '"shopping_list":[{"item_name":"Chai","quantity":1}],"payment_amount_kes":50,"mood":"friendly"},'
            '{"customer_name":"Akinyi","dialogue":"Habari!",'
            '"shopping_list":[{"item_name":"Chai","quantity":1}],"payment_amount_kes":50,"mood":"friendly"},'
            '{"customer_name":"Akinyi","dialogue":"Habari!",'
            '"shopping_list":[{"item_name":"Chai","quantity":1}],"payment_amount_kes":50,"mood":"friendly"}]}'
        )


class CustomerTestAgent(StructuredAgent[CustomerAgentOutput]):
    prompt_name = "customer"
    output_model = CustomerAgentOutput


def build_context() -> AgentContext:
    return AgentContext(
        learner=LearnerProfile(student_id=uuid4(), age=9),
        session=GameplaySessionContext(
            session_id=uuid4(), started_at=datetime.now(UTC), transactions_completed=0
        ),
        progress=ProgressContext(),
        mission=MissionContext(),
    )


@pytest.mark.asyncio
async def test_structured_agent_validates_provider_json() -> None:
    agent = CustomerTestAgent(StaticProvider(), PromptLoader(), "gpt-5.6")
    result = await agent.run(build_context())
    assert len(result.scenarios) == 5
    assert result.scenarios[0].customer_name == "Akinyi"


def test_prompt_loader_reads_versioned_prompt() -> None:
    prompt = PromptLoader().load("customer")
    assert prompt.version == "1"
    assert "Customer Agent" in prompt.content
    assert "Tier 1" in prompt.content
