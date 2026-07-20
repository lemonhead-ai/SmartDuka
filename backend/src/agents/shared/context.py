from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class ChatMessageContext(BaseModel):
    sender: Literal["shopkeeper", "customer"]
    message: str


class LearnerProfile(BaseModel):
    student_id: UUID
    age: int = Field(ge=4, le=13)
    # English is the temporary hackathon runtime language. The field remains
    # configurable so the localization layer can be re-enabled later.
    language: str = "en"
    difficulty_tier: int = Field(default=1, ge=1, le=7)


class GameplaySessionContext(BaseModel):
    session_id: UUID
    started_at: datetime
    transactions_completed: int = Field(ge=0)
    last_skill: str | None = None
    last_answer_was_correct: bool | None = None


class ProgressContext(BaseModel):
    attempts: int = Field(default=0, ge=0)
    correct_attempts: int = Field(default=0, ge=0)
    weak_skills: list[str] = Field(default_factory=list)
    consecutive_same_skill_mistakes: int = Field(default=0, ge=0)
    recent_improvement: bool = False
    basket_feedback: str | None = None


class MissionContext(BaseModel):
    active_mission_id: UUID | None = None
    progress_value: int = Field(default=0, ge=0)
    target_value: int | None = Field(default=None, ge=1)
    mission_type: str | None = None


class RequestedItemContext(BaseModel):
    item_id: str
    name: str
    quantity: int


class CustomerContext(BaseModel):
    id: str
    name: str
    personality: str
    greeting: str
    request: str
    requested_items: list[RequestedItemContext]


class BasketItemContext(BaseModel):
    name: str
    quantity: int


class AgentContext(BaseModel):
    learner: LearnerProfile
    session: GameplaySessionContext
    progress: ProgressContext
    mission: MissionContext
    available_goods: list[str] = Field(default_factory=list)
    customer: CustomerContext | None = None
    basket: list[BasketItemContext] = Field(default_factory=list)
    chat_history: list[ChatMessageContext] = Field(default_factory=list)
