from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from .common import LanguageCode
from .gameplay import GameplayEvent


class SyncUploadRequest(BaseModel):
    child_id: UUID
    device_id: str = Field(min_length=1, max_length=128)
    events: list[GameplayEvent] = Field(min_length=1, max_length=250)


class CustomerOrderLine(BaseModel):
    product_id: str = Field(min_length=1, max_length=64)
    product_name: str = Field(min_length=1, max_length=100)
    quantity: int = Field(ge=1, le=100)
    unit_price_kes: int = Field(ge=0, le=10_000)


class CustomerScenario(BaseModel):
    id: UUID
    customer_name: str = Field(min_length=1, max_length=100)
    dialogue: str = Field(min_length=1, max_length=500)
    language: LanguageCode
    difficulty_tier: int = Field(ge=1, le=7)
    order: list[CustomerOrderLine] = Field(min_length=1, max_length=5)
    tendered_amount_kes: int = Field(ge=0, le=10_000)
    cached_at: datetime
    expires_at: datetime


class MissionSnapshot(BaseModel):
    id: UUID
    title: str = Field(min_length=1, max_length=120)
    briefing: str = Field(min_length=1, max_length=500)
    target_value: int = Field(ge=1)
    current_value: int = Field(ge=0)
    difficulty_tier: int = Field(ge=1, le=7)
    expires_at: datetime


class DifficultyProfileSnapshot(BaseModel):
    tier: int = Field(ge=1, le=7)
    updated_at: datetime


class SyncUploadResponse(BaseModel):
    accepted_event_ids: list[UUID]
    scenarios: list[CustomerScenario]
    missions: list[MissionSnapshot]
    difficulty_profile: DifficultyProfileSnapshot
    synced_at: datetime
