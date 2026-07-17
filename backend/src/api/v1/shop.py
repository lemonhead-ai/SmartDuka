from fastapi import APIRouter

from src.contracts.shop import (
    AddShopItemsRequest,
    CatalogItemResponse,
    RestockShopItemRequest,
    ShopResponse,
    ShopSetupRequest,
    ShopStockItemResponse,
)
from src.core.exceptions import ApplicationError
from src.dependencies.database import DatabaseSession
from src.services.gameplay.managers import ShopInventoryManager
from src.database.repositories.gameplay import GameplayRepository

router = APIRouter(prefix="/shop", tags=["shop"])


def stock_item_response(stock: object, item: object) -> ShopStockItemResponse:
    return ShopStockItemResponse(
        id=item.id,
        name=item.name,
        category=item.category,
        price_kes=ShopInventoryManager.price(item),
        image_placeholder=item.image_placeholder,
        stock=stock.stock,
    )


@router.get("/catalog", response_model=list[CatalogItemResponse])
async def catalog(db: DatabaseSession) -> list[CatalogItemResponse]:
    items = await GameplayRepository(db).list_inventory()
    return [CatalogItemResponse(id=item.id, name=item.name, category=item.category, price_kes=ShopInventoryManager.price(item), image_placeholder=item.image_placeholder) for item in items]


@router.get("", response_model=ShopResponse)
async def get_shop(db: DatabaseSession) -> ShopResponse:
    repository = GameplayRepository(db)
    student = await repository.get_demo_student()
    shop = await repository.get_shop(student.id) if student else None
    if shop is None:
        raise ApplicationError("Create your duka before starting a session.", status_code=404)
    stock = await repository.list_shop_stock(student.id)
    return ShopResponse(
        id=shop.id,
        name=shop.name,
        category=shop.category,
        items=[stock_item_response(stock_row, item) for stock_row, item in stock],
    )


@router.post("", response_model=ShopResponse, status_code=201)
async def create_shop(payload: ShopSetupRequest, db: DatabaseSession) -> ShopResponse:
    repository = GameplayRepository(db)
    student = await repository.get_demo_student()
    if student is None:
        raise ApplicationError("Demo learner is unavailable.", status_code=503)
    if await repository.get_shop(student.id):
        raise ApplicationError("This learner already has a duka.", status_code=409)
    catalogue = {item.id: item for item in await repository.list_inventory()}
    selected = [catalogue.get(item_id) for item_id in payload.item_ids]
    if len(set(payload.item_ids)) != len(payload.item_ids) or any(item is None for item in selected):
        raise ApplicationError("Choose valid catalogue items.", status_code=422)
    if any(item.category != payload.category for item in selected if item):
        raise ApplicationError("Choose products from one shop category.", status_code=422)
    shop = await repository.create_shop(student.id, payload.name.strip(), payload.category, payload.item_ids)
    await db.commit()
    stock = await repository.list_shop_stock(student.id)
    return ShopResponse(
        id=shop.id,
        name=shop.name,
        category=shop.category,
        items=[stock_item_response(stock_row, item) for stock_row, item in stock],
    )


@router.post("/items", response_model=ShopResponse, summary="Add products to the duka")
async def add_shop_items(payload: AddShopItemsRequest, db: DatabaseSession) -> ShopResponse:
    repository = GameplayRepository(db)
    student = await repository.get_demo_student()
    shop = await repository.get_shop(student.id) if student else None
    if shop is None:
        raise ApplicationError("Create your duka before adding products.", status_code=409)
    catalogue = {item.id: item for item in await repository.list_inventory()}
    if len(set(payload.item_ids)) != len(payload.item_ids) or any(
        item_id not in catalogue for item_id in payload.item_ids
    ):
        raise ApplicationError("Choose valid catalogue items.", status_code=422)
    if not await repository.add_shop_items(shop, payload.item_ids, payload.initial_stock):
        raise ApplicationError("Those products are already in your duka.", status_code=409)
    await db.commit()
    stock = await repository.list_shop_stock(student.id)
    return ShopResponse(
        id=shop.id,
        name=shop.name,
        category=shop.category,
        items=[stock_item_response(stock_row, item) for stock_row, item in stock],
    )


@router.post("/restock", response_model=ShopResponse, summary="Restock a duka product")
async def restock_shop_item(payload: RestockShopItemRequest, db: DatabaseSession) -> ShopResponse:
    repository = GameplayRepository(db)
    student = await repository.get_demo_student()
    if student is None:
        raise ApplicationError("Demo learner is unavailable.", status_code=503)
    shop = await repository.get_shop(student.id)
    if shop is None:
        raise ApplicationError("Create your duka before restocking.", status_code=409)
    if await repository.restock_shop_item(student.id, payload.item_id, payload.quantity) is None:
        raise ApplicationError("Add this product to your duka before restocking it.", status_code=404)
    await db.commit()
    stock = await repository.list_shop_stock(student.id)
    return ShopResponse(
        id=shop.id,
        name=shop.name,
        category=shop.category,
        items=[stock_item_response(stock_row, item) for stock_row, item in stock],
    )
