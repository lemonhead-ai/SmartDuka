from pydantic import BaseModel, Field


class CustomerAgentOutput(BaseModel):
    customer_name: str
    dialogue: str
    item_count: int = Field(ge=1, le=5)


class TutorAgentOutput(BaseModel):
    hint: str
    focus_skill: str


class DifficultyAgentOutput(BaseModel):
    recommended_tier: int = Field(ge=1, le=7)
    rationale: str


class MissionAgentOutput(BaseModel):
    title: str
    briefing: str
    target_value: int = Field(ge=1)


class RewardAgentOutput(BaseModel):
    reward_type: str
    amount: int = Field(ge=1)


class InsightAgentOutput(BaseModel):
    summary: str
    recommended_action: str


class LocalizationAgentOutput(BaseModel):
    localized_text: str
    culturally_valid: bool
