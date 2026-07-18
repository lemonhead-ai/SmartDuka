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


class LiteracyChoiceResponse(BaseModel):
    id: str
    label: str


class LiteracyChallengeResponse(BaseModel):
    id: str
    type: Literal["word_reading", "sentence_reading", "spelling", "conversation"]
    prompt: str
    content: str
    choices: list[LiteracyChoiceResponse] = Field(default_factory=list)
    letter_options: list[str] = Field(default_factory=list)
    difficulty_tier: int = Field(ge=1, le=7)
    attempts: int = Field(ge=0)
    complete: bool
    is_available: bool


class AnswerLiteracyChallengeRequest(BaseModel):
    answer: str = Field(min_length=1, max_length=100)


class AnswerLiteracyChallengeResponse(BaseModel):
    is_correct: bool
    feedback: str
    attempts: int
    challenge_complete: bool
    challenge: LiteracyChallengeResponse
    rewards_preview: "RewardResponse | None" = None


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
    literacy_challenge: LiteracyChallengeResponse | None = None
    request_version: int = Field(default=0, ge=0)


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
    request_version: int = Field(default=0, ge=0)


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


class BadgeResponse(BaseModel):
    id: str
    name: str
    description: str


class DailyMissionResponse(BaseModel):
    id: str
    title: str
    description: str
    kind: Literal["sales", "math", "literacy"]
    progress: int = Field(ge=0)
    target: int = Field(ge=1)
    completed: bool


class MotivationResponse(BaseModel):
    daily_mission: DailyMissionResponse
    current_streak_days: int = Field(ge=0)
    badges: list[BadgeResponse] = Field(default_factory=list)


class CaregiverLearningSummaryResponse(BaseModel):
    headline: str
    celebrations: list[str]
    next_step: str


class TeacherLearningSummaryResponse(BaseModel):
    accuracy_percent: int = Field(ge=0, le=100)
    learning_level: int = Field(ge=1, le=7)
    strengths: list[str]
    support_focus: str
    suggested_activity: str


class LearningSummaryResponse(BaseModel):
    student_name: str
    questions_attempted: int = Field(ge=0)
    correct_answers: int = Field(ge=0)
    literacy_moments_completed: int = Field(ge=0)
    parent_summary: CaregiverLearningSummaryResponse
    teacher_summary: TeacherLearningSummaryResponse


class StartGameplaySessionResponse(BaseModel):
    session_id: UUID
    student_name: str
    started_at: datetime
    mission: MissionResponse
    motivation: MotivationResponse


class NextCustomerResponse(BaseModel):
    customer: CustomerResponse
    basket: BasketResponse
    mission: MissionResponse
    literacy_challenge: LiteracyChallengeResponse | None = None


class ResolveStockOfferResponse(BaseModel):
    customer: CustomerResponse
    basket: BasketResponse
    literacy_challenge: LiteracyChallengeResponse | None = None


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
