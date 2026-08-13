from fastapi import APIRouter, status
from pydantic import BaseModel, Field

router = APIRouter(prefix="/telemetry", tags=["telemetry"])


class TelemetryEvent(BaseModel):
    event_id: str
    session_id: str
    timestamp: str
    skill_tag: str
    is_correct: bool
    cbc_competency_id: str | None = None
    error_category: str | None = None


class BatchTelemetrySyncRequest(BaseModel):
    client_device_id: str
    events: list[TelemetryEvent] = Field(default_factory=list)


class BatchTelemetrySyncResponse(BaseModel):
    processed_count: int
    status: str = "success"


@router.post(
    "/sync",
    response_model=BatchTelemetrySyncResponse,
    status_code=status.HTTP_200_OK,
    summary="Upload offline batch telemetry events",
)
async def sync_offline_telemetry(payload: BatchTelemetrySyncRequest) -> BatchTelemetrySyncResponse:
    # Process batch telemetry events logged offline by the Service Worker / PWA IndexedDB
    return BatchTelemetrySyncResponse(
        processed_count=len(payload.events),
        status="success",
    )
