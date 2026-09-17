import logging

from src.core.config import Settings
from src.services.ai.providers import FallbackProvider, LLMProvider, OpenAIProvider

logger = logging.getLogger(__name__)


def _openai_compatible_provider(
    *,
    api_key: str,
    base_url: str,
    provider_name: str,
    settings: Settings,
    timeout_seconds: float | None = None,
    max_retries: int = 1,
) -> OpenAIProvider:
    return OpenAIProvider(
        api_key=api_key,
        base_url=base_url,
        use_responses_api=False,
        timeout_seconds=timeout_seconds
        if timeout_seconds is not None
        else settings.llm_attempt_timeout_seconds,
        max_retries=max_retries,
        provider_name=provider_name,
    )


def create_llm_provider(settings: Settings) -> LLMProvider:
    has_featherless_key = bool(
        settings.featherless_api_key and settings.featherless_api_key.strip()
    )
    has_gemini_key = bool(settings.gemini_api_key and settings.gemini_api_key.strip())
    has_openai_key = bool(settings.openai_api_key and settings.openai_api_key.strip())
    has_groq_key = bool(settings.groq_api_key and settings.groq_api_key.strip())
    has_openrouter_key = bool(settings.openrouter_api_key and settings.openrouter_api_key.strip())

    if settings.llm_provider == "ollama":
        ollama_provider = _openai_compatible_provider(
            api_key="ollama",
            base_url=settings.ollama_base_url,
            provider_name="Ollama",
            settings=settings,
            timeout_seconds=settings.llm_attempt_timeout_seconds,
            max_retries=0,
        )
        if has_gemini_key:
            logger.info("Configured Ollama as primary provider with Gemini fallback.")
            gemini_provider = _openai_compatible_provider(
                api_key=settings.gemini_api_key,
                base_url=settings.gemini_base_url,
                provider_name="Gemini",
                settings=settings,
                timeout_seconds=30.0,
                max_retries=2,
            )
            return FallbackProvider(
                primary_provider=ollama_provider,
                primary_model=settings.ollama_model,
                fallback_provider=gemini_provider,
                fallback_model=settings.gemini_model,
                primary_timeout_seconds=settings.llm_attempt_timeout_seconds,
            )
        if has_groq_key:
            logger.info("Configured Ollama as primary provider with Groq fallback.")
            groq_provider = _openai_compatible_provider(
                api_key=settings.groq_api_key,
                base_url=settings.groq_base_url,
                provider_name="Groq",
                settings=settings,
            )
            return FallbackProvider(
                primary_provider=ollama_provider,
                primary_model=settings.ollama_model,
                fallback_provider=groq_provider,
                fallback_model=settings.groq_model,
                primary_timeout_seconds=settings.llm_attempt_timeout_seconds,
            )
        if has_openrouter_key:
            logger.info("Configured Ollama as primary provider with OpenRouter fallback.")
            openrouter_provider = _openai_compatible_provider(
                api_key=settings.openrouter_api_key,
                base_url=settings.openrouter_base_url,
                provider_name="OpenRouter",
                settings=settings,
            )
            return FallbackProvider(
                primary_provider=ollama_provider,
                primary_model=settings.ollama_model,
                fallback_provider=openrouter_provider,
                fallback_model=settings.openrouter_model,
                primary_timeout_seconds=settings.llm_attempt_timeout_seconds,
            )
        return ollama_provider

    if settings.llm_provider == "groq":
        if not has_groq_key:
            if has_openrouter_key:
                logger.info("SMARTDUKA_GROQ_API_KEY not set. Using OpenRouter.")
                return _openai_compatible_provider(
                    api_key=settings.openrouter_api_key,
                    base_url=settings.openrouter_base_url,
                    provider_name="OpenRouter",
                    settings=settings,
                )
            raise ValueError(
                "SMARTDUKA_GROQ_API_KEY or SMARTDUKA_OPENROUTER_API_KEY is required for cloud AI"
            )
        groq_provider = _openai_compatible_provider(
            api_key=settings.groq_api_key,
            base_url=settings.groq_base_url,
            provider_name="Groq",
            settings=settings,
        )
        if has_openrouter_key:
            logger.info("Configured Groq as primary provider with OpenRouter fallback.")
            openrouter_provider = _openai_compatible_provider(
                api_key=settings.openrouter_api_key,
                base_url=settings.openrouter_base_url,
                provider_name="OpenRouter",
                settings=settings,
            )
            return FallbackProvider(
                primary_provider=groq_provider,
                primary_model=settings.groq_model,
                fallback_provider=openrouter_provider,
                fallback_model=settings.openrouter_model,
            )
        return groq_provider

    if settings.llm_provider == "openrouter":
        if not has_openrouter_key:
            if has_groq_key:
                logger.info("SMARTDUKA_OPENROUTER_API_KEY not set. Using Groq.")
                return _openai_compatible_provider(
                    api_key=settings.groq_api_key,
                    base_url=settings.groq_base_url,
                    provider_name="Groq",
                    settings=settings,
                )
            if has_gemini_key:
                logger.info("SMARTDUKA_OPENROUTER_API_KEY not set. Using Gemini fallback.")
                return _openai_compatible_provider(
                    api_key=settings.gemini_api_key,
                    base_url=settings.gemini_base_url,
                    provider_name="Gemini",
                    settings=settings,
                )
            raise ValueError("SMARTDUKA_OPENROUTER_API_KEY is required for cloud AI")
        openrouter_provider = _openai_compatible_provider(
            api_key=settings.openrouter_api_key,
            base_url=settings.openrouter_base_url,
            provider_name="OpenRouter",
            settings=settings,
            timeout_seconds=20.0,
            max_retries=1,
        )
        if has_groq_key:
            logger.info("Configured OpenRouter as primary provider with Groq fallback.")
            groq_provider = _openai_compatible_provider(
                api_key=settings.groq_api_key,
                base_url=settings.groq_base_url,
                provider_name="Groq",
                settings=settings,
            )
            return FallbackProvider(
                primary_provider=openrouter_provider,
                primary_model=settings.openrouter_model,
                fallback_provider=groq_provider,
                fallback_model=settings.groq_model,
                primary_timeout_seconds=settings.llm_attempt_timeout_seconds,
            )
        if has_gemini_key:
            logger.info("Configured OpenRouter as primary provider with Gemini fallback.")
            gemini_provider = _openai_compatible_provider(
                api_key=settings.gemini_api_key,
                base_url=settings.gemini_base_url,
                provider_name="Gemini",
                settings=settings,
                timeout_seconds=30.0,
                max_retries=2,
            )
            return FallbackProvider(
                primary_provider=openrouter_provider,
                primary_model=settings.openrouter_model,
                fallback_provider=gemini_provider,
                fallback_model=settings.gemini_model,
                primary_timeout_seconds=15.0,
            )
        return openrouter_provider

    if settings.llm_provider in ("gemini", "google"):
        if not has_gemini_key:
            raise ValueError("SMARTDUKA_GEMINI_API_KEY is required for the Gemini provider")
        return _openai_compatible_provider(
            api_key=settings.gemini_api_key,
            base_url=settings.gemini_base_url,
            provider_name="Gemini",
            settings=settings,
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
