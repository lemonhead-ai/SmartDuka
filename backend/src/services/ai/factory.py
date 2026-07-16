from src.core.config import Settings
from src.services.ai.providers import LLMProvider, OpenAIProvider


def create_llm_provider(settings: Settings) -> LLMProvider:
    if settings.llm_provider == "featherless":
        if not settings.featherless_api_key:
            raise ValueError(
                "SMARTDUKA_FEATHERLESS_API_KEY is required for the Featherless provider"
            )
        return OpenAIProvider(
            api_key=settings.featherless_api_key,
            base_url=settings.featherless_base_url,
            use_responses_api=False,
        )
    elif settings.llm_provider == "openai":
        if not settings.openai_api_key:
            raise ValueError("SMARTDUKA_OPENAI_API_KEY is required for the OpenAI provider")
        return OpenAIProvider(api_key=settings.openai_api_key)

    raise ValueError(f"Unsupported LLM provider: {settings.llm_provider}")
