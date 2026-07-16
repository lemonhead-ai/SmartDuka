from uuid import UUID

from fastapi import APIRouter

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
from src.dependencies.core import AIOrchestratorDependency
from src.dependencies.database import DatabaseSession
from src.services.gameplay.engine import GameplayEngine

router = APIRouter(prefix="/gameplay", tags=["gameplay"])


@router.post(
    "/sessions",
    response_model=StartGameplaySessionResponse,
    status_code=201,
    summary="Start a demo gameplay session",
    description="Creates an active session for the seeded demo learner and returns its mission.",
)
async def start_gameplay_session(
    db: DatabaseSession, orchestrator: AIOrchestratorDependency
) -> StartGameplaySessionResponse:
    return await GameplayEngine(db, orchestrator).start_session()


@router.post(
    "/sessions/{session_id}/customers/next",
    response_model=NextCustomerResponse,
    summary="Serve the next customer",
)
async def next_customer(
    session_id: UUID, db: DatabaseSession, orchestrator: AIOrchestratorDependency
) -> NextCustomerResponse:
    return await GameplayEngine(db, orchestrator).next_customer(session_id)


@router.get(
    "/sessions/{session_id}/inventory",
    response_model=list[InventoryItemResponse],
    summary="List available shop inventory",
)
async def list_inventory(
    session_id: UUID, db: DatabaseSession, orchestrator: AIOrchestratorDependency
) -> list[InventoryItemResponse]:
    return await GameplayEngine(db, orchestrator).list_inventory(session_id)


@router.get("/sessions/{session_id}/basket", response_model=BasketResponse, summary="Get basket")
async def get_basket(
    session_id: UUID, db: DatabaseSession, orchestrator: AIOrchestratorDependency
) -> BasketResponse:
    return await GameplayEngine(db, orchestrator).get_basket(session_id)


@router.post(
    "/sessions/{session_id}/basket/items", response_model=BasketResponse, summary="Add an item"
)
async def add_basket_item(
    session_id: UUID,
    payload: BasketItemRequest,
    db: DatabaseSession,
    orchestrator: AIOrchestratorDependency,
) -> BasketResponse:
    return await GameplayEngine(db, orchestrator).add_basket_item(
        session_id, payload.item_id, payload.quantity
    )


@router.delete(
    "/sessions/{session_id}/basket/items/{item_id}",
    response_model=BasketResponse,
    summary="Remove a basket item",
)
async def remove_basket_item(
    session_id: UUID,
    item_id: UUID,
    db: DatabaseSession,
    orchestrator: AIOrchestratorDependency,
) -> BasketResponse:
    return await GameplayEngine(db, orchestrator).remove_basket_item(session_id, item_id)


@router.get(
    "/sessions/{session_id}/challenge",
    response_model=ChallengeResponse | None,
    summary="Get the active math challenge",
)
async def current_challenge(
    session_id: UUID, db: DatabaseSession, orchestrator: AIOrchestratorDependency
) -> ChallengeResponse | None:
    return await GameplayEngine(db, orchestrator).current_challenge(session_id)


@router.post(
    "/sessions/{session_id}/challenge/answer",
    response_model=AnswerChallengeResponse,
    summary="Submit a math answer",
)
async def answer_challenge(
    session_id: UUID,
    payload: AnswerChallengeRequest,
    db: DatabaseSession,
    orchestrator: AIOrchestratorDependency,
) -> AnswerChallengeResponse:
    return await GameplayEngine(db, orchestrator).submit_answer(session_id, payload.answer)


@router.post("/sessions/{session_id}/hint", response_model=HintResponse, summary="Request a hint")
async def request_hint(
    session_id: UUID, db: DatabaseSession, orchestrator: AIOrchestratorDependency
) -> HintResponse:
    return await GameplayEngine(db, orchestrator).request_hint(session_id)


@router.post(
    "/sessions/{session_id}/checkout", response_model=CheckoutResponse, summary="Checkout basket"
)
async def checkout(
    session_id: UUID, db: DatabaseSession, orchestrator: AIOrchestratorDependency
) -> CheckoutResponse:
    return await GameplayEngine(db, orchestrator).checkout(session_id)


@router.get(
    "/sessions/{session_id}/summary",
    response_model=SessionSummaryResponse,
    summary="Get session summary",
)
async def session_summary(
    session_id: UUID, db: DatabaseSession, orchestrator: AIOrchestratorDependency
) -> SessionSummaryResponse:
    return await GameplayEngine(db, orchestrator).summary(session_id)


@router.get("/progress", response_model=PlayerProgressResponse, summary="Get demo learner progress")
async def player_progress(
    db: DatabaseSession, orchestrator: AIOrchestratorDependency
) -> PlayerProgressResponse:
    return await GameplayEngine(db, orchestrator).player_progress()
