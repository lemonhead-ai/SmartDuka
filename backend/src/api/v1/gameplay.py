from uuid import UUID

from fastapi import APIRouter

from src.contracts.demo import (
    AnswerQuestionRequest,
    AnswerQuestionResponse,
    NextQuestionResponse,
    ProgressResponse,
    StartSessionResponse,
)
from src.contracts.gameplay_engine import (
    AnswerChallengeRequest,
    AnswerChallengeResponse,
    BasketItemRequest,
    BasketResponse,
    ChallengeResponse,
    CheckoutResponse,
    HintResponse,
    InventoryItemResponse,
    NextCustomerResponse,
    PlayerProgressResponse,
    SessionSummaryResponse,
    StartGameplaySessionResponse,
)
from src.dependencies.database import DatabaseSession
from src.services.gameplay.engine import GameplayEngine
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


@router.post("/sessions/start", response_model=StartGameplaySessionResponse, status_code=201)
async def start_gameplay_session(db: DatabaseSession) -> StartGameplaySessionResponse:
    return await GameplayEngine(db).start_session()


@router.post("/sessions/{session_id}/customers/next", response_model=NextCustomerResponse)
async def next_customer(session_id: UUID, db: DatabaseSession) -> NextCustomerResponse:
    return await GameplayEngine(db).next_customer(session_id)


@router.get("/sessions/{session_id}/inventory", response_model=list[InventoryItemResponse])
async def list_inventory(session_id: UUID, db: DatabaseSession) -> list[InventoryItemResponse]:
    return await GameplayEngine(db).list_inventory(session_id)


@router.get("/sessions/{session_id}/basket", response_model=BasketResponse)
async def get_basket(session_id: UUID, db: DatabaseSession) -> BasketResponse:
    return await GameplayEngine(db).get_basket(session_id)


@router.post("/sessions/{session_id}/basket/items", response_model=BasketResponse)
async def add_basket_item(
    session_id: UUID, payload: BasketItemRequest, db: DatabaseSession
) -> BasketResponse:
    return await GameplayEngine(db).add_basket_item(session_id, payload.item_id, payload.quantity)


@router.delete("/sessions/{session_id}/basket/items/{item_id}", response_model=BasketResponse)
async def remove_basket_item(
    session_id: UUID, item_id: UUID, db: DatabaseSession
) -> BasketResponse:
    return await GameplayEngine(db).remove_basket_item(session_id, item_id)


@router.get("/sessions/{session_id}/challenge", response_model=ChallengeResponse | None)
async def current_challenge(session_id: UUID, db: DatabaseSession) -> ChallengeResponse | None:
    return await GameplayEngine(db).current_challenge(session_id)


@router.post("/sessions/{session_id}/challenge/answer", response_model=AnswerChallengeResponse)
async def answer_challenge(
    session_id: UUID, payload: AnswerChallengeRequest, db: DatabaseSession
) -> AnswerChallengeResponse:
    return await GameplayEngine(db).submit_answer(session_id, payload.answer)


@router.post("/sessions/{session_id}/hint", response_model=HintResponse)
async def request_hint(session_id: UUID, db: DatabaseSession) -> HintResponse:
    return await GameplayEngine(db).request_hint(session_id)


@router.post("/sessions/{session_id}/checkout", response_model=CheckoutResponse)
async def checkout(session_id: UUID, db: DatabaseSession) -> CheckoutResponse:
    return await GameplayEngine(db).checkout(session_id)


@router.get("/sessions/{session_id}/summary", response_model=SessionSummaryResponse)
async def session_summary(session_id: UUID, db: DatabaseSession) -> SessionSummaryResponse:
    return await GameplayEngine(db).summary(session_id)


@router.get("/player-progress", response_model=PlayerProgressResponse)
async def player_progress(db: DatabaseSession) -> PlayerProgressResponse:
    return await GameplayEngine(db).player_progress()
