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
from src.agents.shared.outputs import CustomerAgentOutput, StockOfferDecisionOutput, TutorAgentOutput
from src.services.ai.orchestrator import AIOrchestrator


class FixedAgent:
    def __init__(self, output: object) -> None:
        self.output = output

    async def run(self, _: AgentContext) -> object:
        return self.output


@pytest.mark.asyncio
async def test_orchestrator_runs_customer_batches_and_tutor_interventions_separately() -> None:
    agents = SimpleNamespace(
        customer=FixedAgent(
            CustomerAgentOutput(
                scenarios=[
                    {
                        "customer_name": "Akinyi",
                        "dialogue": "Habari",
                        "shopping_list": [{"item_name": "Chai", "quantity": 1}],
                        "payment_amount_kes": 50,
                        "checkout_question": "I paid KES 50. What change do I get?",
                        "mood": "friendly",
                    }
                ] * 5,
            )
        ),
        tutor=FixedAgent(
            TutorAgentOutput(
                hint="Count again",
                focus_skill="addition",
                encouragement="Keep trying",
            )
        ),
        stock_offer=FixedAgent(
            StockOfferDecisionOutput(
                accepts_available_quantity=True,
                dialogue="I can take what you have.",
            )
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

    orchestrator = AIOrchestrator(agents)
    result = await orchestrator.generate_customer_batch(context)
    tutor = await orchestrator.tutor(context)
    stock_offer = await orchestrator.resolve_stock_offer(context)

    assert len(result.scenarios) == 5
    assert tutor.reveal_answer is False
    assert stock_offer.accepts_available_quantity is True
