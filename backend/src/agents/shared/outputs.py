from typing import Literal

from pydantic import BaseModel, Field


class CustomerAgentOutput(BaseModel):
    customer_name: str
    dialogue: str
    shopping_request: str
    item_count: int = Field(ge=1, le=5)
    mood: Literal["friendly", "curious", "rushed"]


class TutorAgentOutput(BaseModel):
    hint: str
    focus_skill: str
    encouragement: str
    reveal_answer: Literal[False] = False


class DifficultyAgentOutput(BaseModel):
    recommended_tier: int = Field(ge=1, le=7)
    adjustment: Literal["increase", "stay", "decrease"]
    rationale: str


class MissionAgentOutput(BaseModel):
    title: str
    briefing: str
    goal_description: str
    target_value: int = Field(ge=1, le=10)


class RewardAgentOutput(BaseModel):
    reward_type: str
    amount: int = Field(ge=1)
    reason: str
    celebration_message: str


class InsightAgentOutput(BaseModel):
    summary: str
    recommended_action: str
    strength: str


class LocalizationAgentOutput(BaseModel):
    localized_text: str
    culturally_valid: bool
    language: Literal["sw", "en"]
