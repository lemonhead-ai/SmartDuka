from fastapi import APIRouter, Request, Response, status

from src.contracts.auth import (
    AuthenticatedShopkeeperResponse,
    MessageResponse,
    PasswordResetConfirmRequest,
    PasswordResetRequest,
    ShopkeeperResponse,
    SignInRequest,
    SignUpRequest,
    UpdateProfileRequest,
)
from src.core.config import Settings
from src.core.exceptions import ApplicationError
from src.core.security import fingerprint_token
from src.database.repositories.auth import AuthRepository
from src.dependencies.auth import CurrentShopkeeper
from src.dependencies.core import SettingsDependency
from src.dependencies.database import DatabaseSession
from src.services.auth import AuthService

router = APIRouter(prefix="/auth", tags=["authentication"])


def response_for(shopkeeper: object) -> ShopkeeperResponse:
    return ShopkeeperResponse(
        id=shopkeeper.id,
        email=shopkeeper.email,
        display_name=shopkeeper.display_name,
        created_at=shopkeeper.created_at,
    )


def set_session_cookie(response: Response, token: str, settings: Settings) -> None:
    response.set_cookie(
        key=settings.auth_session_cookie_name,
        value=token,
        max_age=settings.auth_session_days * 24 * 60 * 60,
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite="none" if settings.auth_cookie_secure else "lax",
        path="/",
    )


@router.post(
    "/sign-up", response_model=AuthenticatedShopkeeperResponse, status_code=status.HTTP_201_CREATED
)
async def sign_up(
    payload: SignUpRequest,
    response: Response,
    db: DatabaseSession,
    settings: SettingsDependency,
) -> AuthenticatedShopkeeperResponse:
    try:
        shopkeeper, token = await AuthService(AuthRepository(db), settings).register(
            str(payload.email), payload.display_name, payload.password
        )
    except ValueError as error:
        raise ApplicationError(str(error), status_code=409) from error
    await db.commit()
    set_session_cookie(response, token, settings)
    return AuthenticatedShopkeeperResponse(shopkeeper=response_for(shopkeeper))


@router.post("/sign-in", response_model=AuthenticatedShopkeeperResponse)
async def sign_in(
    payload: SignInRequest,
    response: Response,
    db: DatabaseSession,
    settings: SettingsDependency,
) -> AuthenticatedShopkeeperResponse:
    authenticated = await AuthService(AuthRepository(db), settings).authenticate(
        str(payload.email), payload.password
    )
    if authenticated is None:
        raise ApplicationError("Email or password is incorrect.", status_code=401)
    shopkeeper, token = authenticated
    await db.commit()
    set_session_cookie(response, token, settings)
    return AuthenticatedShopkeeperResponse(shopkeeper=response_for(shopkeeper))


@router.post("/sign-out", response_model=MessageResponse)
async def sign_out(
    request: Request,
    response: Response,
    db: DatabaseSession,
    settings: SettingsDependency,
) -> MessageResponse:
    # Sign-out remains idempotent so a stale browser can always clear itself safely.
    token = request.cookies.get(settings.auth_session_cookie_name)
    if token:
        await AuthRepository(db).revoke_session(fingerprint_token(token))
        await db.commit()
    response.delete_cookie(settings.auth_session_cookie_name, path="/")
    return MessageResponse(message="You have been signed out.")


@router.get("/me", response_model=AuthenticatedShopkeeperResponse)
async def current_shopkeeper(shopkeeper: CurrentShopkeeper) -> AuthenticatedShopkeeperResponse:
    return AuthenticatedShopkeeperResponse(shopkeeper=response_for(shopkeeper))


@router.patch("/me", response_model=AuthenticatedShopkeeperResponse)
async def update_current_shopkeeper(
    payload: UpdateProfileRequest,
    shopkeeper: CurrentShopkeeper,
    db: DatabaseSession,
) -> AuthenticatedShopkeeperResponse:
    updated = await AuthRepository(db).update_profile_name(shopkeeper, payload.display_name.strip())
    await db.commit()
    return AuthenticatedShopkeeperResponse(shopkeeper=response_for(updated))


@router.delete("/me", response_model=MessageResponse)
async def delete_current_shopkeeper(
    shopkeeper: CurrentShopkeeper,
    db: DatabaseSession,
    response: Response,
    settings: SettingsDependency,
) -> MessageResponse:
    await AuthRepository(db).delete_shopkeeper(shopkeeper)
    await db.commit()
    response.delete_cookie(settings.auth_session_cookie_name, path="/")
    return MessageResponse(message="Your account has been deleted.")


@router.post(
    "/password-reset", response_model=MessageResponse, status_code=status.HTTP_202_ACCEPTED
)
async def request_password_reset(
    payload: PasswordResetRequest, db: DatabaseSession, settings: SettingsDependency
) -> MessageResponse:
    await AuthService(AuthRepository(db), settings).request_password_reset(str(payload.email))
    await db.commit()
    return MessageResponse(message="If that email has an account, reset instructions will be sent.")


@router.post("/password-reset/confirm", response_model=MessageResponse)
async def confirm_password_reset(
    payload: PasswordResetConfirmRequest, db: DatabaseSession, settings: SettingsDependency
) -> MessageResponse:
    reset = await AuthService(AuthRepository(db), settings).reset_password(
        payload.token, payload.password
    )
    if not reset:
        raise ApplicationError("This reset link is invalid or has expired.", status_code=400)
    await db.commit()
    return MessageResponse(message="Your password has been reset. Please sign in.")
