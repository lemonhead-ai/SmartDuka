from dataclasses import dataclass

from src.agents.base.prompt_loader import PromptLoader
from src.agents.customer_agent import CustomerAgent, StockOfferAgent
from src.agents.tutor_agent import TutorAgent
from src.core.config import Settings
from src.services.ai.factory import create_llm_provider
from src.services.ai.orchestrator import AIOrchestrator
from src.services.ai.providers import LLMProvider


@dataclass(frozen=True)
class AgentBundle:
    customer: CustomerAgent
    stock_offer: StockOfferAgent
    tutor: TutorAgent


def create_ai_orchestrator(
    settings: Settings, provider: LLMProvider | None = None
) -> AIOrchestrator:
    configured_provider = provider or create_llm_provider(settings)
    model = (
        settings.featherless_model
        if settings.llm_provider == "featherless"
        else settings.openai_model
    )
    prompt_loader = PromptLoader()
    common_kwargs = {
        "provider": configured_provider,
        "prompt_loader": prompt_loader,
        "model": model,
        "temperature": 0.1,
    }
    return AIOrchestrator(
        AgentBundle(
            # Keep outputs deliberately compact to reduce latency and token use.
            customer=CustomerAgent(**common_kwargs, max_output_tokens=850),
            stock_offer=StockOfferAgent(**common_kwargs, max_output_tokens=160),
            tutor=TutorAgent(**common_kwargs, max_output_tokens=220),
        )
    )
