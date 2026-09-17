from dataclasses import dataclass

from src.agents.base.prompt_loader import PromptLoader
from src.agents.customer_agent import CustomerAgent, StockOfferAgent
from src.agents.customer_agent.chat_agent import CustomerChatAgent
from src.agents.tutor_agent import TutorAgent
from src.core.config import Settings
from src.services.ai.factory import create_llm_provider
from src.services.ai.orchestrator import AIOrchestrator
from src.services.ai.providers import LLMProvider


@dataclass(frozen=True)
class AgentBundle:
    customer: CustomerAgent
    customer_chat: CustomerChatAgent
    stock_offer: StockOfferAgent
    tutor: TutorAgent


def create_ai_orchestrator(
    settings: Settings, provider: LLMProvider | None = None
) -> AIOrchestrator:
    configured_provider = provider or create_llm_provider(settings)
    if settings.llm_provider in ("gemini", "google"):
        model = settings.gemini_model
    elif settings.llm_provider == "ollama":
        model = settings.ollama_model
    elif settings.llm_provider == "groq":
        model = settings.groq_model
    elif settings.llm_provider == "openrouter":
        model = settings.openrouter_model
    elif settings.llm_provider == "featherless":
        model = settings.featherless_model
    else:
        model = settings.openai_model
    prompt_loader = PromptLoader()
    common_kwargs = {
        "provider": configured_provider,
        "prompt_loader": prompt_loader,
        "model": model,
        "temperature": 0.1,
    }
    return AIOrchestrator(
        AgentBundle(
            # Output token limits configured with sufficient budget for structured JSON schema.
            customer=CustomerAgent(**common_kwargs, max_output_tokens=2500),
            customer_chat=CustomerChatAgent(**common_kwargs, max_output_tokens=600),
            stock_offer=StockOfferAgent(**common_kwargs, max_output_tokens=500),
            tutor=TutorAgent(**common_kwargs, max_output_tokens=600),
        ),
        request_timeout_seconds=settings.llm_timeout_seconds,
    )
