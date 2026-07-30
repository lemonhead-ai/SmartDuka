import logging
from src.services.ai.providers.base import LLMProvider

logger = logging.getLogger(__name__)


class FallbackProvider:
    """LLM provider wrapper that falls back to a backup provider when primary calls fail."""

    def __init__(
        self,
        primary_provider: LLMProvider,
        primary_model: str,
        fallback_provider: LLMProvider,
        fallback_model: str,
    ) -> None:
        self.primary_provider = primary_provider
        self.primary_model = primary_model
        self.fallback_provider = fallback_provider
        self.fallback_model = fallback_model

    async def complete(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        model: str,
        temperature: float,
        max_output_tokens: int,
    ) -> str:
        try:
            return await self.primary_provider.complete(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                model=self.primary_model or model,
                temperature=temperature,
                max_output_tokens=max_output_tokens,
            )
        except Exception as exc:
            logger.warning(
                "Primary LLM provider (%s) failed: %s. Falling back to Gemini (%s)...",
                self.primary_model or model,
                exc,
                self.fallback_model,
            )
            return await self.fallback_provider.complete(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                model=self.fallback_model,
                temperature=temperature,
                max_output_tokens=max_output_tokens,
            )
