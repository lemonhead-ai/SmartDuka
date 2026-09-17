from datetime import UTC, datetime
from time import perf_counter

from fastapi import APIRouter, status

from src.contracts.health import CloudReadinessResponse, HealthResponse
from src.core.exceptions import ApplicationError
from src.dependencies.auth import CurrentShopkeeper
from src.dependencies.core import AIOrchestratorDependency, SettingsDependency

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse, summary="Application health check")
async def get_health(settings: SettingsDependency) -> HealthResponse:
    return HealthResponse(
        status="ok",
        environment=settings.environment,
        timestamp=datetime.now(UTC),
    )


def _cloud_models(settings: SettingsDependency) -> tuple[str, str, str | None, str | None]:
    if settings.llm_provider == "openrouter" and settings.openrouter_api_key:
        return (
            "OpenRouter",
            settings.openrouter_model,
            "Groq" if settings.groq_api_key else None,
            settings.groq_model if settings.groq_api_key else None,
        )
    if settings.llm_provider == "groq" and not settings.groq_api_key:
        return "OpenRouter", settings.openrouter_model, None, None
    if settings.llm_provider == "openrouter" and not settings.openrouter_api_key:
        return "Groq", settings.groq_model, None, None
    return (
        "Groq",
        settings.groq_model,
        "OpenRouter" if settings.openrouter_api_key else None,
        settings.openrouter_model if settings.openrouter_api_key else None,
    )


@router.post(
    "/health/ai",
    response_model=CloudReadinessResponse,
    status_code=status.HTTP_200_OK,
    summary="Verify the configured cloud AI provider",
)
async def check_cloud_ai_readiness(
    settings: SettingsDependency,
    orchestrator: AIOrchestratorDependency,
    _: CurrentShopkeeper,
) -> CloudReadinessResponse:
    if orchestrator is None or settings.llm_provider not in {"groq", "openrouter"}:
        raise ApplicationError(
            "Configure Groq or OpenRouter cloud AI before running this check.",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    started_at = perf_counter()
    try:
        await orchestrator.cloud_readiness()
    except Exception as error:
        raise ApplicationError(
            "Cloud AI did not pass its readiness check. Confirm the provider key and model, then try again.",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        ) from error
    provider, model, fallback_provider, fallback_model = _cloud_models(settings)
    return CloudReadinessResponse(
        status="ready",
        provider=provider,
        model=model,
        fallback_provider=fallback_provider,
        fallback_model=fallback_model,
        latency_ms=round((perf_counter() - started_at) * 1_000),
    )
