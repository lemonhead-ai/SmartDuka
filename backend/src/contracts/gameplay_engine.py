from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class InventoryItemResponse(BaseModel):
    id: UUID
    name: str
    category: str
    price_kes: int
    image_placeholder: str
    stock: int
    educational_tags: list[str]


class RequestedItemResponse(BaseModel):
    item_id: UUID
    name: str
    quantity: int = Field(ge=1)


class BasketValidationIssue(BaseModel):
    item_id: UUID | None = None
    name: str
    expected_quantity: int = Field(ge=0)
    selected_quantity: int = Field(ge=0)


class BasketValidationResponse(BaseModel):
    is_valid: bool
    missing_items: list[BasketValidationIssue] = Field(default_factory=list)
    unexpected_items: list[BasketValidationIssue] = Field(default_factory=list)
    quantity_mismatches: list[BasketValidationIssue] = Field(default_factory=list)
    tutor_feedback: str


class BasketItemRequest(BaseModel):
    item_id: UUID
    quantity: int = Field(ge=1, le=10)


class BasketLineResponse(BaseModel):
    item: InventoryItemResponse
    quantity: int
    line_total_kes: int


class BasketResponse(BaseModel):
    lines: list[BasketLineResponse]
    total_kes: int
    validation: BasketValidationResponse


class StockOfferResponse(BaseModel):
    item_id: UUID
    name: str
    requested_quantity: int = Field(ge=1)
    available_quantity: int = Field(ge=0)
    status: Literal["pending", "accepted", "replaced"]
    message: str


class CustomerResponse(BaseModel):
    id: str
    name: str
    personality: Literal["friendly", "curious", "busy", "elderly", "parent", "child"]
    greeting: str
    request: str
    requested_items: list[RequestedItemResponse]
    stock_offer: StockOfferResponse | None = None


class ChallengeResponse(BaseModel):
    id: str
    prompt: str
    skill: str
    difficulty_tier: int
    attempts: int
    hints_used: int
    total_kes: int
    amount_due_kes: int
    amount_paid_kes: int
    discount_kes: int = Field(ge=0)


class HintResponse(BaseModel):
    hint: str
    encouragement: str
    hints_used: int


class AnswerChallengeRequest(BaseModel):
    answer: int = Field(ge=0, le=100_000)


class AnswerChallengeResponse(BaseModel):
    is_correct: bool
    feedback: str
    attempts: int
    challenge_complete: bool
    rewards_preview: "RewardResponse | None" = None


class RewardResponse(BaseModel):
    coins: int
    xp: int
    stars: int
    message: str


class MissionResponse(BaseModel):
    title: str
    progress: int
    target: int
    completed: bool


class StartGameplaySessionResponse(BaseModel):
    session_id: UUID
    student_name: str
    started_at: datetime
    mission: MissionResponse


class NextCustomerResponse(BaseModel):
    customer: CustomerResponse
    basket: BasketResponse
    mission: MissionResponse


class ResolveStockOfferResponse(BaseModel):
    customer: CustomerResponse
    basket: BasketResponse


class CheckoutResponse(BaseModel):
    status: Literal["challenge_required", "completed"]
    challenge: ChallengeResponse | None = None
    reward: RewardResponse | None = None
    mission: MissionResponse
    next_customer_available: bool


class SessionSummaryResponse(BaseModel):
    session_id: UUID
    customers_served: int
    questions_attempted: int
    correct_answers: int
    hints_used: int
    coins_earned: int
    xp_earned: int
    stars_earned: int
    achievements: list[str]
    mission: MissionResponse


class PlayerProgressResponse(BaseModel):
    student_name: str
    questions_attempted: int
    correct_answers: int
    hints_used: int
    time_spent_seconds: int
    coins_earned: int
    xp_earned: int
    stars_earned: int
    missions_completed: int
    current_learning_level: int
    skills_improving: list[str]
    daily_streak_days: int
