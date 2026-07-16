from datetime import datetime
from typing import Annotated, Literal
from uuid import UUID

from pydantic import BaseModel, Field, PositiveInt


class SessionStartedPayload(BaseModel):
    session_id: UUID
    started_at: datetime


class TransactionCompletedPayload(BaseModel):
    session_id: UUID
    scenario_id: UUID
    correct: bool
    attempts: Annotated[int, Field(ge=1, le=3)]
    total_kes: Annotated[int, Field(ge=0)]
    change_kes: Annotated[int, Field(ge=0)]


class MissionProgressedPayload(BaseModel):
    mission_id: UUID
    current_value: Annotated[int, Field(ge=0)]
    target_value: PositiveInt


class SessionEndedPayload(BaseModel):
    session_id: UUID
    ended_at: datetime


class SessionStartedEvent(BaseModel):
    id: UUID
    child_id: UUID
    type: Literal["session_started"]
    timestamp: datetime
    payload: SessionStartedPayload


class TransactionCompletedEvent(BaseModel):
    id: UUID
    child_id: UUID
    type: Literal["transaction_completed"]
    timestamp: datetime
    payload: TransactionCompletedPayload


class MissionProgressedEvent(BaseModel):
    id: UUID
    child_id: UUID
    type: Literal["mission_progressed"]
    timestamp: datetime
    payload: MissionProgressedPayload


class SessionEndedEvent(BaseModel):
    id: UUID
    child_id: UUID
    type: Literal["session_ended"]
    timestamp: datetime
    payload: SessionEndedPayload


GameplayEvent = Annotated[
    SessionStartedEvent | TransactionCompletedEvent | MissionProgressedEvent | SessionEndedEvent,
    Field(discriminator="type"),
]
