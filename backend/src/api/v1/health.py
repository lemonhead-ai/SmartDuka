from datetime import UTC, datetime

from fastapi import APIRouter

from src.contracts.health import HealthResponse
from src.dependencies.core import SettingsDependency

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse, summary="Application health check")
async def get_health(settings: SettingsDependency) -> HealthResponse:
    return HealthResponse(
        status="ok",
        environment=settings.environment,
        timestamp=datetime.now(UTC),
    )
