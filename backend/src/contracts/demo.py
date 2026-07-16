from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class DemoStudentResponse(BaseModel):
    id: UUID
    display_name: str
    language: str
    difficulty_tier: int


class StartSessionResponse(BaseModel):
    session_id: UUID
    student: DemoStudentResponse
    started_at: datetime


class QuestionResponse(BaseModel):
    id: UUID
    prompt: str
    skill: str
    difficulty_tier: int


class NextQuestionResponse(BaseModel):
    question: QuestionResponse | None


class AnswerQuestionRequest(BaseModel):
    answer: int = Field(ge=0, le=100_000)


class ProgressResponse(BaseModel):
    student: DemoStudentResponse
    questions_attempted: int
    questions_correct: int
    accuracy_percent: float


class AnswerQuestionResponse(BaseModel):
    is_correct: bool
    progress: ProgressResponse
