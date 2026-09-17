from datetime import datetime

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    environment: str
    timestamp: datetime


class CloudReadinessResponse(BaseModel):
    status: str
    provider: str
    model: str
    fallback_provider: str | None = None
    fallback_model: str | None = None
    latency_ms: int
