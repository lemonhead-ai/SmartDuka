from typing import Annotated

from fastapi import Depends, Request

from src.core.config import Settings, get_settings
from src.core.exceptions import ApplicationError
from src.core.security import fingerprint_token
from src.database.models import Shopkeeper
from src.database.repositories.auth import AuthRepository
from src.dependencies.database import DatabaseSession


async def get_current_shopkeeper(
    request: Request, db: DatabaseSession, settings: Annotated[Settings, Depends(get_settings)]
) -> Shopkeeper:
    token = request.cookies.get(settings.auth_session_cookie_name)
    if not token:
        authorization = request.headers.get("Authorization", "")
        if authorization.lower().startswith("bearer "):
            token = authorization[7:].strip()
    if not token:
        raise ApplicationError("Sign in is required.", status_code=401)
    shopkeeper = await AuthRepository(db).get_session_shopkeeper(fingerprint_token(token))
    if shopkeeper is None:
        raise ApplicationError("Your session has expired. Please sign in again.", status_code=401)
    return shopkeeper


async def get_optional_current_shopkeeper(
    request: Request, db: DatabaseSession, settings: Annotated[Settings, Depends(get_settings)]
) -> Shopkeeper | None:
    token = request.cookies.get(settings.auth_session_cookie_name)
    if not token:
        authorization = request.headers.get("Authorization", "")
        if authorization.lower().startswith("bearer "):
            token = authorization[7:].strip()
    if not token:
        return None
    shopkeeper = await AuthRepository(db).get_session_shopkeeper(fingerprint_token(token))
    if shopkeeper is None:
        raise ApplicationError("Your session has expired. Please sign in again.", status_code=401)
    return shopkeeper


CurrentShopkeeper = Annotated[Shopkeeper, Depends(get_current_shopkeeper)]
OptionalCurrentShopkeeper = Annotated[Shopkeeper | None, Depends(get_optional_current_shopkeeper)]
