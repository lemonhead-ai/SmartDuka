from datetime import datetime
from typing import Literal
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
    restock_cost_kes: int = Field(ge=0)


class ShopSetupRequest(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    # Kept for compatibility with earlier clients. A duka can now stock items
    # from any catalogue category, so new shops are created as general shops.
    category: str = Field(default="general", min_length=2, max_length=40)
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
    cash_balance_kes: int = Field(ge=0)
    items: list[ShopStockItemResponse]


class ShopLedgerEntryResponse(BaseModel):
    id: UUID
    entry_type: Literal["sale", "restock", "new_stock"]
    amount_kes: int
    description: str
    created_at: datetime


class ShopLedgerResponse(BaseModel):
    cash_balance_kes: int = Field(ge=0)
    daily_revenue_kes: int = Field(ge=0)
    daily_expenses_kes: int = Field(ge=0)
    daily_profit_kes: int
    sales_count: int = Field(ge=0)
    recent_entries: list[ShopLedgerEntryResponse]
