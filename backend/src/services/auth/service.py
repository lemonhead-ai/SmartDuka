from datetime import UTC, datetime, timedelta

from src.core.config import Settings
from src.core.security import (
    create_opaque_token,
    fingerprint_token,
    hash_password,
    verify_password,
)
from src.database.models import Shopkeeper
from src.database.repositories.auth import AuthRepository


class AuthService:
    def __init__(self, repository: AuthRepository, settings: Settings) -> None:
        self.repository = repository
        self.settings = settings

    async def register(
        self, email: str, display_name: str, password: str
    ) -> tuple[Shopkeeper, str]:
        normalized_email = email.strip().lower()
        normalized_name = display_name.strip()
        if not normalized_name:
            raise ValueError("Enter your name.")
        if await self.repository.get_shopkeeper_by_email(normalized_email):
            raise ValueError("An account with this email already exists.")
        shopkeeper = await self.repository.create_shopkeeper(
            normalized_email, normalized_name, hash_password(password)
        )
        await self.repository.create_learner_profile(shopkeeper)
        return shopkeeper, await self._issue_session(shopkeeper)

    async def authenticate(self, email: str, password: str) -> tuple[Shopkeeper, str] | None:
        shopkeeper = await self.repository.get_shopkeeper_by_email(email.strip().lower())
        if shopkeeper is None or not verify_password(password, shopkeeper.password_hash):
            return None
        if not shopkeeper.is_active:
            return None
        return shopkeeper, await self._issue_session(shopkeeper)

    async def _issue_session(self, shopkeeper: Shopkeeper) -> str:
        token = create_opaque_token()
        await self.repository.create_session(
            shopkeeper.id,
            fingerprint_token(token),
            datetime.now(UTC) + timedelta(days=self.settings.auth_session_days),
        )
        return token

    async def request_password_reset(self, email: str) -> None:
        shopkeeper = await self.repository.get_shopkeeper_by_email(email.strip().lower())
        if shopkeeper is None or not shopkeeper.is_active:
            return
        token = create_opaque_token()
        await self.repository.create_password_reset(
            shopkeeper.id,
            fingerprint_token(token),
            datetime.now(UTC) + timedelta(minutes=self.settings.password_reset_minutes),
        )
        # Delivery is intentionally delegated to the production mail adapter. Never expose reset tokens.

    async def reset_password(self, token: str, password: str) -> bool:
        shopkeeper = await self.repository.consume_password_reset(fingerprint_token(token))
        if shopkeeper is None:
            return False
        shopkeeper.password_hash = hash_password(password)
        await self.repository.revoke_shopkeeper_sessions(shopkeeper.id)
        return True
