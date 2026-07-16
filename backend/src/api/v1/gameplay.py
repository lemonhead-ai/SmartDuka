from uuid import UUID

from fastapi import APIRouter

from src.contracts.demo import (
    AnswerQuestionRequest,
    AnswerQuestionResponse,
    NextQuestionResponse,
    ProgressResponse,
    StartSessionResponse,
)
from src.dependencies.database import DatabaseSession
from src.services.gameplay.service import GameplayService

router = APIRouter(prefix="/gameplay", tags=["gameplay"])


@router.post("/sessions", response_model=StartSessionResponse, status_code=201)
async def start_demo_session(db: DatabaseSession) -> StartSessionResponse:
    return await GameplayService(db).start_demo_session()


@router.get("/sessions/{session_id}/question", response_model=NextQuestionResponse)
async def get_next_question(session_id: UUID, db: DatabaseSession) -> NextQuestionResponse:
    return await GameplayService(db).get_next_question(session_id)


@router.post(
    "/sessions/{session_id}/questions/{question_id}/answer",
    response_model=AnswerQuestionResponse,
)
async def answer_question(
    session_id: UUID,
    question_id: UUID,
    payload: AnswerQuestionRequest,
    db: DatabaseSession,
) -> AnswerQuestionResponse:
    return await GameplayService(db).answer_question(session_id, question_id, payload.answer)


@router.get("/progress", response_model=ProgressResponse)
async def get_demo_progress(db: DatabaseSession) -> ProgressResponse:
    return await GameplayService(db).get_demo_progress()
