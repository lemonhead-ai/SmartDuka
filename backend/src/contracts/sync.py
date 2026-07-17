from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class SyncEvent(BaseModel):
    """An append-only event created by the offline client."""

    id: str = Field(min_length=1, max_length=128)
    type: Literal[
        "session_started",
        "item_selected",
        "transaction_completed",
        "mission_progressed",
        "mission_completed",
        "session_ended",
    ]
    payload: dict[str, Any] = Field(default_factory=dict)
    created_at: int = Field(alias="createdAt", ge=0)
    retry_count: int = Field(default=0, alias="retryCount", ge=0)

    model_config = ConfigDict(populate_by_name=True)


class SyncBootstrapRequest(BaseModel):
    child_id: str | None = Field(default=None, alias="childId")
    device_id: str | None = Field(default=None, alias="deviceId", max_length=128)

    model_config = ConfigDict(populate_by_name=True)


class SyncUploadRequest(SyncBootstrapRequest):
    events: list[SyncEvent] = Field(min_length=1, max_length=250)

    model_config = ConfigDict(populate_by_name=True)


class CachedScenarioResponse(BaseModel):
    id: str
    child_id: str = Field(alias="childId")
    title: str
    customer_name: str = Field(alias="customerName")
    customer_mood: str = Field(alias="customerMood")
    difficulty_tier: int = Field(alias="difficultyTier", ge=1, le=7)
    payload: dict[str, Any]
    cached_at: int = Field(alias="cachedAt", ge=0)
    expires_at: int = Field(alias="expiresAt", ge=0)

    model_config = ConfigDict(populate_by_name=True)


class MissionSnapshot(BaseModel):
    title: str
    briefing: str
    target_value: int = Field(alias="targetValue", ge=1)

    model_config = ConfigDict(populate_by_name=True)


class TutorSnapshot(BaseModel):
    hint: str
    encouragement: str
    focus_skill: str = Field(alias="focusSkill")

    model_config = ConfigDict(populate_by_name=True)


class SyncConflictResponse(BaseModel):
    event_id: str = Field(alias="eventId")
    reason: str

    model_config = ConfigDict(populate_by_name=True)


class SyncUploadResponse(BaseModel):
    accepted_event_ids: list[str] = Field(alias="acceptedEventIds")
    conflicts: list[SyncConflictResponse] = Field(default_factory=list)
    scenarios: list[CachedScenarioResponse]
    missions: list[MissionSnapshot]
    tutor: TutorSnapshot | None = None
    synced_at: datetime = Field(alias="syncedAt")

    model_config = ConfigDict(populate_by_name=True)
