import asyncio
import time
from datetime import UTC, datetime
from uuid import uuid4

from src.agents.shared.context import (
    AgentContext,
    BasketItemContext,
    ChatMessageContext,
    CustomerContext,
    GameplaySessionContext,
    LearnerProfile,
    MissionContext,
    ProgressContext,
    RequestedItemContext,
)
from src.core.config import get_settings
from src.services.ai.runtime import create_ai_orchestrator


async def main():
    settings = get_settings()
    settings.llm_provider = "openrouter"
    settings.openrouter_model = "meta-llama/llama-3.3-70b-instruct"
    settings.llm_timeout_seconds = 45.0
    print("Testing with provider:", settings.llm_provider, "model:", settings.openrouter_model)
    orch = create_ai_orchestrator(settings)
    orch.agents.customer_chat.max_output_tokens = 600
    orch.agents.customer.max_output_tokens = 2500

    ctx = AgentContext(
        learner=LearnerProfile(
            student_id=uuid4(),
            age=8,
            language="en",
            difficulty_tier=1,
        ),
        session=GameplaySessionContext(
            session_id=uuid4(),
            started_at=datetime.now(UTC),
            transactions_completed=1,
        ),
        progress=ProgressContext(),
        mission=MissionContext(),
        available_goods=["Milk", "Bread", "Juice", "Eggs"],
        customer=CustomerContext(
            id=str(uuid4()),
            name="Amani",
            personality="curious",
            greeting="Hello! Can we work this out together?",
            request="I need 1 juice, please.",
            requested_items=[RequestedItemContext(item_id=str(uuid4()), name="Juice", quantity=1)],
        ),
        basket=[BasketItemContext(name="Juice", quantity=1)],
        chat_history=[
            ChatMessageContext(
                sender="shopkeeper",
                message="I only have 1 juice left. Would you like to take that amount instead?",
            ),
            ChatMessageContext(
                sender="customer", message="I can take what you have today, thank you."
            ),
            ChatMessageContext(
                sender="shopkeeper", message="okay thank you, i added the requested items"
            ),
        ],
    )

    print("\n--- Testing Customer Chat with Gemini ---")
    t0 = time.time()
    try:
        chat_res = await orch.agents.customer_chat.run(ctx)
        print(f"Chat took {time.time() - t0:.2f}s")
        print("Chat reply:", chat_res.reply)
        print("Chat sentiment:", chat_res.sentiment)
    except Exception as e:
        print("Chat failed:", type(e), e)

    print("\n--- Testing Customer Batch with Gemini ---")
    t1 = time.time()
    try:
        batch_res = await orch.generate_customer_batch(ctx)
        print(f"Batch took {time.time() - t1:.2f}s")
        print("Batch count:", len(batch_res.scenarios))
        print("Generated customer names:", [s.customer_name for s in batch_res.scenarios])
    except Exception as e:
        print("Batch failed:", type(e), e)


if __name__ == "__main__":
    asyncio.run(main())
