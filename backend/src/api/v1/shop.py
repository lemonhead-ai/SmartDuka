from fastapi import APIRouter

from src.contracts.shop import (
    AddShopItemsRequest,
    CatalogItemResponse,
    RestockShopItemRequest,
    ShopLedgerEntryResponse,
    ShopLedgerResponse,
    ShopResponse,
    ShopSetupRequest,
    ShopStockItemResponse,
)
from src.core.exceptions import ApplicationError
from src.database.repositories.gameplay import GameplayRepository
from src.dependencies.auth import OptionalCurrentShopkeeper
from src.dependencies.database import DatabaseSession
from src.services.gameplay.managers import ShopInventoryManager

router = APIRouter(prefix="/shop", tags=["shop"])


def stock_item_response(stock: object, item: object) -> ShopStockItemResponse:
    return ShopStockItemResponse(
        id=item.id,
        name=item.name,
        category=item.category,
        price_kes=ShopInventoryManager.price(item),
        image_placeholder=item.image_placeholder,
        stock=stock.stock,
        restock_cost_kes=item.supplier_cost_kes,
    )


async def owner_student(
    repository: GameplayRepository, shopkeeper: OptionalCurrentShopkeeper
) -> object | None:
    if shopkeeper is not None:
        return await repository.get_student_for_shopkeeper(shopkeeper.id)
    return await repository.get_demo_student()


@router.get("/catalog", response_model=list[CatalogItemResponse])
async def catalog(db: DatabaseSession) -> list[CatalogItemResponse]:
    items = await GameplayRepository(db).list_inventory()
    return [
        CatalogItemResponse(
            id=item.id,
            name=item.name,
            category=item.category,
            price_kes=ShopInventoryManager.price(item),
            image_placeholder=item.image_placeholder,
        )
        for item in items
    ]


@router.get("", response_model=ShopResponse)
async def get_shop(db: DatabaseSession, shopkeeper: OptionalCurrentShopkeeper) -> ShopResponse:
    repository = GameplayRepository(db)
    student = await owner_student(repository, shopkeeper)
    shop = await repository.get_shop(student.id) if student else None
    if shop is None:
        raise ApplicationError("Create your duka before starting a session.", status_code=404)
    stock = await repository.list_all_shop_stock(student.id)
    return ShopResponse(
        id=shop.id,
        name=shop.name,
        category=shop.category,
        cash_balance_kes=shop.cash_balance_kes,
        items=[stock_item_response(stock_row, item) for stock_row, item in stock],
    )


@router.post("", response_model=ShopResponse, status_code=201)
async def create_shop(
    payload: ShopSetupRequest, db: DatabaseSession, shopkeeper: OptionalCurrentShopkeeper
) -> ShopResponse:
    repository = GameplayRepository(db)
    student = await owner_student(repository, shopkeeper)
    if student is None:
        raise ApplicationError("Your learner profile is unavailable. Please sign in again.", status_code=401)
    if await repository.get_shop(student.id):
        raise ApplicationError("This learner already has a duka.", status_code=409)
    catalogue = {item.id: item for item in await repository.list_inventory()}
    selected = [catalogue.get(item_id) for item_id in payload.item_ids]
    if len(set(payload.item_ids)) != len(payload.item_ids) or any(
        item is None for item in selected
    ):
        raise ApplicationError("Choose valid catalogue items.", status_code=422)
    shop = await repository.create_shop(
        student.id, payload.name.strip(), "general", payload.item_ids
    )
    await db.commit()
    stock = await repository.list_all_shop_stock(student.id)
    return ShopResponse(
        id=shop.id,
        name=shop.name,
        category=shop.category,
        cash_balance_kes=shop.cash_balance_kes,
        items=[stock_item_response(stock_row, item) for stock_row, item in stock],
    )


@router.post("/items", response_model=ShopResponse, summary="Add products to the duka")
async def add_shop_items(
    payload: AddShopItemsRequest, db: DatabaseSession, shopkeeper: OptionalCurrentShopkeeper
) -> ShopResponse:
    repository = GameplayRepository(db)
    student = await owner_student(repository, shopkeeper)
    shop = await repository.get_shop(student.id) if student else None
    if shop is None:
        raise ApplicationError("Create your duka before adding products.", status_code=409)
    catalogue = {item.id: item for item in await repository.list_inventory()}
    if len(set(payload.item_ids)) != len(payload.item_ids) or any(
        item_id not in catalogue for item_id in payload.item_ids
    ):
        raise ApplicationError("Choose valid catalogue items.", status_code=422)
    try:
        if not await repository.add_shop_items(shop, payload.item_ids, payload.initial_stock):
            raise ApplicationError("Those products are already in your duka.", status_code=409)
    except ValueError as error:
        raise ApplicationError(str(error), status_code=409) from error
    await db.commit()
    stock = await repository.list_all_shop_stock(student.id)
    return ShopResponse(
        id=shop.id,
        name=shop.name,
        category=shop.category,
        cash_balance_kes=shop.cash_balance_kes,
        items=[stock_item_response(stock_row, item) for stock_row, item in stock],
    )


@router.post("/restock", response_model=ShopResponse, summary="Restock a duka product")
async def restock_shop_item(
    payload: RestockShopItemRequest, db: DatabaseSession, shopkeeper: OptionalCurrentShopkeeper
) -> ShopResponse:
    repository = GameplayRepository(db)
    student = await owner_student(repository, shopkeeper)
    if student is None:
        raise ApplicationError("Your learner profile is unavailable. Please sign in again.", status_code=401)
    shop = await repository.get_shop(student.id)
    if shop is None:
        raise ApplicationError("Create your duka before restocking.", status_code=409)
    try:
        if (
            await repository.restock_shop_item(student.id, payload.item_id, payload.quantity)
            is None
        ):
            raise ApplicationError(
                "Add this product to your duka before restocking it.", status_code=404
            )
    except ValueError as error:
        raise ApplicationError(str(error), status_code=409) from error
    await db.commit()
    stock = await repository.list_all_shop_stock(student.id)
    return ShopResponse(
        id=shop.id,
        name=shop.name,
        category=shop.category,
        cash_balance_kes=shop.cash_balance_kes,
        items=[stock_item_response(stock_row, item) for stock_row, item in stock],
    )


@router.get("/ledger", response_model=ShopLedgerResponse, summary="Read the duka cash ledger")
async def shop_ledger(db: DatabaseSession, shopkeeper: OptionalCurrentShopkeeper) -> ShopLedgerResponse:
    repository = GameplayRepository(db)
    student = await owner_student(repository, shopkeeper)
    shop = await repository.get_shop(student.id) if student else None
    if shop is None:
        raise ApplicationError("Create your duka before viewing its ledger.", status_code=404)
    daily_entries = await repository.daily_ledger_entries(shop.id)
    revenue = sum(entry.amount_kes for entry in daily_entries if entry.amount_kes > 0)
    expenses = -sum(entry.amount_kes for entry in daily_entries if entry.amount_kes < 0)
    entries = await repository.list_ledger_entries(shop.id)
    return ShopLedgerResponse(
        cash_balance_kes=shop.cash_balance_kes,
        daily_revenue_kes=revenue,
        daily_expenses_kes=expenses,
        daily_profit_kes=revenue - expenses,
        sales_count=sum(entry.entry_type == "sale" for entry in daily_entries),
        recent_entries=[
            ShopLedgerEntryResponse(
                id=entry.id,
                entry_type=entry.entry_type,
                amount_kes=entry.amount_kes,
                description=entry.description,
                created_at=entry.created_at,
            )
            for entry in entries
        ],
    )
