from src.core.config import Settings
from src.services.ai.providers import LLMProvider, OpenAIProvider


def create_llm_provider(settings: Settings) -> LLMProvider:
    if settings.llm_provider != "openai":
        raise ValueError(f"Unsupported LLM provider: {settings.llm_provider}")
    if not settings.openai_api_key:
        raise ValueError("SMARTDUKA_OPENAI_API_KEY is required for the OpenAI provider")
    return OpenAIProvider(api_key=settings.openai_api_key)
