from typing import Literal

from pydantic import BaseModel, Field


class CustomerOrderItem(BaseModel):
    item_name: str
    quantity: int = Field(ge=1, le=5)


class CustomerScenarioOutput(BaseModel):
    customer_name: str
    dialogue: str
    shopping_list: list[CustomerOrderItem] = Field(min_length=1, max_length=3)
    payment_amount_kes: int = Field(ge=1, le=10_000)
    mood: Literal["friendly", "curious", "rushed"]


class CustomerAgentOutput(BaseModel):
    scenarios: list[CustomerScenarioOutput] = Field(min_length=5, max_length=8)


class TutorAgentOutput(BaseModel):
    hint: str
    focus_skill: str
    encouragement: str
    reveal_answer: Literal[False] = False


class MissionAgentOutput(BaseModel):
    title: str
    briefing: str
    goal_description: str
    target_value: int = Field(ge=1, le=10)
