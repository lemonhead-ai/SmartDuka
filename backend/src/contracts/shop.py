from uuid import UUID

from pydantic import BaseModel, Field


class CatalogItemResponse(BaseModel):
    id: UUID
    name: str
    category: str
    price_kes: int
    image_placeholder: str


class ShopStockItemResponse(CatalogItemResponse):
    stock: int = Field(ge=0)


class ShopSetupRequest(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    category: str = Field(min_length=2, max_length=40)
    item_ids: list[UUID] = Field(min_length=2, max_length=5)


class AddShopItemsRequest(BaseModel):
    item_ids: list[UUID] = Field(min_length=1, max_length=12)
    initial_stock: int = Field(default=10, ge=1, le=100)


class RestockShopItemRequest(BaseModel):
    item_id: UUID
    quantity: int = Field(ge=1, le=100)


class ShopResponse(BaseModel):
    id: UUID
    name: str
    category: str
    items: list[ShopStockItemResponse]
