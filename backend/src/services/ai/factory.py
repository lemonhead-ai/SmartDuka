import logging

from src.core.config import Settings
from src.services.ai.providers import FallbackProvider, LLMProvider, OpenAIProvider

logger = logging.getLogger(__name__)


def create_llm_provider(settings: Settings) -> LLMProvider:
    has_featherless_key = bool(settings.featherless_api_key and settings.featherless_api_key.strip())
    has_gemini_key = bool(settings.gemini_api_key and settings.gemini_api_key.strip())
    has_openai_key = bool(settings.openai_api_key and settings.openai_api_key.strip())

    if settings.llm_provider in ("gemini", "google"):
        if not has_gemini_key:
            raise ValueError("SMARTDUKA_GEMINI_API_KEY is required for the Gemini provider")
        return OpenAIProvider(
            api_key=settings.gemini_api_key,
            base_url=settings.gemini_base_url,
            use_responses_api=False,
        )

    if settings.llm_provider == "featherless":
        if not has_featherless_key:
            if has_gemini_key:
                logger.info(
                    "SMARTDUKA_FEATHERLESS_API_KEY not set. Using Gemini provider fallback."
                )
                return OpenAIProvider(
                    api_key=settings.gemini_api_key,
                    base_url=settings.gemini_base_url,
                    use_responses_api=False,
                )
            raise ValueError(
                "SMARTDUKA_FEATHERLESS_API_KEY or SMARTDUKA_GEMINI_API_KEY is required"
            )

        featherless_provider = OpenAIProvider(
            api_key=settings.featherless_api_key,
            base_url=settings.featherless_base_url,
            use_responses_api=False,
            chat_template_kwargs={
                "enable_thinking": settings.featherless_enable_thinking,
            },
        )

        if has_gemini_key:
            logger.info("Configured Featherless as primary provider with Gemini fallback.")
            gemini_provider = OpenAIProvider(
                api_key=settings.gemini_api_key,
                base_url=settings.gemini_base_url,
                use_responses_api=False,
            )
            return FallbackProvider(
                primary_provider=featherless_provider,
                primary_model=settings.featherless_model,
                fallback_provider=gemini_provider,
                fallback_model=settings.gemini_model,
            )

        return featherless_provider

    if settings.llm_provider == "openai":
        if not has_openai_key:
            raise ValueError("SMARTDUKA_OPENAI_API_KEY is required for the OpenAI provider")
        return OpenAIProvider(api_key=settings.openai_api_key)

    raise ValueError(f"Unsupported LLM provider: {settings.llm_provider}")

