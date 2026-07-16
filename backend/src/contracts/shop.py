from uuid import UUID

from pydantic import BaseModel, Field


class CatalogItemResponse(BaseModel):
    id: UUID
    name: str
    category: str
    price_kes: int
    image_placeholder: str


class ShopSetupRequest(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    category: str = Field(min_length=2, max_length=40)
    item_ids: list[UUID] = Field(min_length=2, max_length=5)


class ShopResponse(BaseModel):
    id: UUID
    name: str
    category: str
    items: list[CatalogItemResponse]
