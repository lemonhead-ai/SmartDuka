from datetime import UTC, datetime

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.database.models import (
    AuthSession,
    PasswordResetToken,
    Shopkeeper,
    Student,
    StudentProgress,
)


class AuthRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_shopkeeper_by_email(self, email: str) -> Shopkeeper | None:
        return await self.session.scalar(select(Shopkeeper).where(Shopkeeper.email == email))

    async def get_shopkeeper(self, shopkeeper_id: object) -> Shopkeeper | None:
        return await self.session.get(Shopkeeper, shopkeeper_id)

    async def create_shopkeeper(
        self, email: str, display_name: str, password_hash: str
    ) -> Shopkeeper:
        shopkeeper = Shopkeeper(
            email=email,
            display_name=display_name,
            password_hash=password_hash,
        )
        self.session.add(shopkeeper)
        await self.session.flush()
        return shopkeeper

    async def create_learner_profile(self, shopkeeper: Shopkeeper) -> Student:
        learner = Student(
            shopkeeper_id=shopkeeper.id,
            display_name=shopkeeper.display_name,
            age=9,
            language="sw",
            difficulty_tier=2,
            is_demo=False,
        )
        self.session.add(learner)
        await self.session.flush()
        self.session.add(StudentProgress(student_id=learner.id))
        await self.session.flush()
        return learner

    async def create_session(
        self, shopkeeper_id: object, token_fingerprint: str, expires_at: datetime
    ) -> AuthSession:
        auth_session = AuthSession(
            shopkeeper_id=shopkeeper_id,
            token_fingerprint=token_fingerprint,
            expires_at=expires_at,
        )
        self.session.add(auth_session)
        await self.session.flush()
        return auth_session

    async def get_session_shopkeeper(self, token_fingerprint: str) -> Shopkeeper | None:
        now = datetime.now(UTC)
        result = await self.session.execute(
            select(Shopkeeper)
            .join(AuthSession, AuthSession.shopkeeper_id == Shopkeeper.id)
            .where(
                AuthSession.token_fingerprint == token_fingerprint,
                AuthSession.revoked_at.is_(None),
                AuthSession.expires_at > now,
                Shopkeeper.is_active.is_(True),
            )
        )
        return result.scalar_one_or_none()

    async def revoke_session(self, token_fingerprint: str) -> None:
        await self.session.execute(
            update(AuthSession)
            .where(AuthSession.token_fingerprint == token_fingerprint, AuthSession.revoked_at.is_(None))
            .values(revoked_at=datetime.now(UTC))
        )

    async def revoke_shopkeeper_sessions(self, shopkeeper_id: object) -> None:
        await self.session.execute(
            update(AuthSession)
            .where(AuthSession.shopkeeper_id == shopkeeper_id, AuthSession.revoked_at.is_(None))
            .values(revoked_at=datetime.now(UTC))
        )

    async def create_password_reset(
        self, shopkeeper_id: object, token_fingerprint: str, expires_at: datetime
    ) -> None:
        self.session.add(
            PasswordResetToken(
                shopkeeper_id=shopkeeper_id,
                token_fingerprint=token_fingerprint,
                expires_at=expires_at,
            )
        )
        await self.session.flush()

    async def consume_password_reset(self, token_fingerprint: str) -> Shopkeeper | None:
        now = datetime.now(UTC)
        result = await self.session.execute(
            select(PasswordResetToken, Shopkeeper)
            .join(Shopkeeper, PasswordResetToken.shopkeeper_id == Shopkeeper.id)
            .where(
                PasswordResetToken.token_fingerprint == token_fingerprint,
                PasswordResetToken.used_at.is_(None),
                PasswordResetToken.expires_at > now,
            )
        )
        row = result.one_or_none()
        if row is None:
            return None
        reset, shopkeeper = row
        reset.used_at = now
        return shopkeeper
