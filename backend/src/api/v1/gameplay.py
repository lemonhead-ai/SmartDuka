from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends

from src.contracts.gameplay_engine import (
    AnswerChallengeRequest,
    AnswerChallengeResponse,
    AnswerLiteracyChallengeRequest,
    AnswerLiteracyChallengeResponse,
    BasketItemRequest,
    BasketResponse,
    ChallengeResponse,
    CheckoutResponse,
    HintResponse,
    InventoryItemResponse,
    LearningSummaryResponse,
    LiteracyChallengeResponse,
    MotivationResponse,
    NextCustomerResponse,
    PlayerProgressResponse,
    ResolveStockOfferResponse,
    SessionSummaryResponse,
    StartGameplaySessionResponse,
    ChatRequest,
    ChatResponse,
)
from src.dependencies.core import AIOrchestratorDependency
from src.dependencies.database import DatabaseSession
from src.dependencies.auth import OptionalCurrentShopkeeper
from src.core.exceptions import ApplicationError
from src.database.repositories.gameplay import GameplayRepository
from src.services.gameplay.engine import GameplayEngine

router = APIRouter(prefix="/gameplay", tags=["gameplay"])


async def get_gameplay_engine(
    db: DatabaseSession,
    orchestrator: AIOrchestratorDependency,
    shopkeeper: OptionalCurrentShopkeeper,
) -> GameplayEngine:
    repository = GameplayRepository(db)
    student = (
        await repository.get_student_for_shopkeeper(shopkeeper.id)
        if shopkeeper is not None
        else await repository.get_demo_student()
    )
    if student is None:
        raise ApplicationError("Create your duka before starting a session.", status_code=409)
    return GameplayEngine(db, orchestrator, student.id)


GameplayEngineDependency = Annotated[GameplayEngine, Depends(get_gameplay_engine)]


@router.post(
    "/sessions",
    response_model=StartGameplaySessionResponse,
    status_code=201,
    summary="Start a demo gameplay session",
    description="Creates an active session for the seeded demo learner and returns its mission.",
)
async def start_gameplay_session(
    engine: GameplayEngineDependency,
) -> StartGameplaySessionResponse:
    return await engine.start_session()


@router.post(
    "/sessions/{session_id}/customers/next",
    response_model=NextCustomerResponse,
    summary="Serve the next customer",
)
async def next_customer(
    session_id: UUID, engine: GameplayEngineDependency,
) -> NextCustomerResponse:
    return await engine.next_customer(session_id)


@router.post(
    "/sessions/{session_id}/customers/stock-offer",
    response_model=ResolveStockOfferResponse,
    summary="Tell a customer about limited stock",
)
async def resolve_stock_offer(
    session_id: UUID, engine: GameplayEngineDependency,
) -> ResolveStockOfferResponse:
    return await engine.resolve_stock_offer(session_id)


@router.post(
    "/sessions/{session_id}/chat",
    response_model=ChatResponse,
    summary="Chat with the current customer",
)
async def chat_with_customer(
    session_id: UUID,
    payload: ChatRequest,
    engine: GameplayEngineDependency,
) -> ChatResponse:
    return await engine.chat(session_id, payload.message)


@router.get(
    "/sessions/{session_id}/inventory",
    response_model=list[InventoryItemResponse],
    summary="List available shop inventory",
)
async def list_inventory(session_id: UUID, engine: GameplayEngineDependency) -> list[InventoryItemResponse]:
    return await engine.list_inventory(session_id)


@router.get("/sessions/{session_id}/basket", response_model=BasketResponse, summary="Get basket")
async def get_basket(session_id: UUID, engine: GameplayEngineDependency) -> BasketResponse:
    return await engine.get_basket(session_id)


@router.post(
    "/sessions/{session_id}/basket/items", response_model=BasketResponse, summary="Add an item"
)
async def add_basket_item(
    session_id: UUID,
    payload: BasketItemRequest,
    engine: GameplayEngineDependency,
) -> BasketResponse:
    return await engine.add_basket_item(session_id, payload.item_id, payload.quantity)


@router.delete(
    "/sessions/{session_id}/basket/items/{item_id}",
    response_model=BasketResponse,
    summary="Remove a basket item",
)
async def remove_basket_item(
    session_id: UUID,
    item_id: UUID,
    engine: GameplayEngineDependency,
) -> BasketResponse:
    return await engine.remove_basket_item(session_id, item_id)


@router.get(
    "/sessions/{session_id}/challenge",
    response_model=ChallengeResponse | None,
    summary="Get the active math challenge",
)
async def current_challenge(session_id: UUID, engine: GameplayEngineDependency) -> ChallengeResponse | None:
    return await engine.current_challenge(session_id)


@router.get(
    "/sessions/{session_id}/literacy",
    response_model=LiteracyChallengeResponse | None,
    summary="Get the active customer literacy moment",
)
async def current_literacy_challenge(
    session_id: UUID, engine: GameplayEngineDependency
) -> LiteracyChallengeResponse | None:
    return await engine.current_literacy_challenge(session_id)


@router.post(
    "/sessions/{session_id}/literacy/answer",
    response_model=AnswerLiteracyChallengeResponse,
    summary="Answer a customer literacy moment",
)
async def answer_literacy_challenge(
    session_id: UUID,
    payload: AnswerLiteracyChallengeRequest,
    engine: GameplayEngineDependency,
) -> AnswerLiteracyChallengeResponse:
    return await engine.submit_literacy_answer(session_id, payload.answer)


@router.post(
    "/sessions/{session_id}/challenge/answer",
    response_model=AnswerChallengeResponse,
    summary="Submit a math answer",
)
async def answer_challenge(
    session_id: UUID,
    payload: AnswerChallengeRequest,
    engine: GameplayEngineDependency,
) -> AnswerChallengeResponse:
    return await engine.submit_answer(session_id, payload.answer)


@router.post("/sessions/{session_id}/hint", response_model=HintResponse, summary="Request a hint")
async def request_hint(
    session_id: UUID, engine: GameplayEngineDependency
) -> HintResponse:
    return await engine.request_hint(session_id)


@router.post(
    "/sessions/{session_id}/checkout", response_model=CheckoutResponse, summary="Checkout basket"
)
async def checkout(session_id: UUID, engine: GameplayEngineDependency) -> CheckoutResponse:
    return await engine.checkout(session_id)


@router.get(
    "/sessions/{session_id}/summary",
    response_model=SessionSummaryResponse,
    summary="Get session summary",
)
async def session_summary(session_id: UUID, engine: GameplayEngineDependency) -> SessionSummaryResponse:
    return await engine.summary(session_id)


@router.get("/progress", response_model=PlayerProgressResponse, summary="Get demo learner progress")
async def player_progress(engine: GameplayEngineDependency) -> PlayerProgressResponse:
    return await engine.player_progress()


@router.get(
    "/motivation",
    response_model=MotivationResponse,
    summary="Get the learner's saved daily motivation",
)
async def motivation_summary(engine: GameplayEngineDependency) -> MotivationResponse:
    return await engine.motivation_summary()


@router.get(
    "/learning-summary",
    response_model=LearningSummaryResponse,
    summary="Get parent and teacher learning summaries",
)
async def learning_summary(engine: GameplayEngineDependency) -> LearningSummaryResponse:
    return await engine.learning_summary()
