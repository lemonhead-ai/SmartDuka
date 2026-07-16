from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class LearnerProfile(BaseModel):
    student_id: UUID
    age: int = Field(ge=4, le=13)
    language: str = "sw"
    difficulty_tier: int = Field(default=1, ge=1, le=7)


class GameplaySessionContext(BaseModel):
    session_id: UUID
    started_at: datetime
    transactions_completed: int = Field(ge=0)


class ProgressContext(BaseModel):
    attempts: int = Field(default=0, ge=0)
    correct_attempts: int = Field(default=0, ge=0)
    weak_skills: list[str] = Field(default_factory=list)


class MissionContext(BaseModel):
    active_mission_id: UUID | None = None
    progress_value: int = Field(default=0, ge=0)
    target_value: int | None = Field(default=None, ge=1)


class AgentContext(BaseModel):
    learner: LearnerProfile
    session: GameplaySessionContext
    progress: ProgressContext
    mission: MissionContext
