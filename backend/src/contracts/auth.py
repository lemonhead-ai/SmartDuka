import re
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class EmailRequestModel(BaseModel):
    @field_validator("email", check_fields=False)
    @classmethod
    def validate_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", normalized):
            raise ValueError("Enter a valid email address.")
        return normalized


class ShopkeeperResponse(BaseModel):
    id: UUID
    email: str
    display_name: str
    created_at: datetime


class SignUpRequest(EmailRequestModel):
    email: str
    display_name: str = Field(min_length=2, max_length=100)
    password: str = Field(min_length=6, max_length=128)


class SignInRequest(EmailRequestModel):
    email: str
    password: str = Field(min_length=1, max_length=128)


class AuthenticatedShopkeeperResponse(BaseModel):
    shopkeeper: ShopkeeperResponse


class PasswordResetRequest(EmailRequestModel):
    email: str


class PasswordResetConfirmRequest(BaseModel):
    token: str = Field(min_length=20, max_length=256)
    password: str = Field(min_length=6, max_length=128)


class MessageResponse(BaseModel):
    message: str
