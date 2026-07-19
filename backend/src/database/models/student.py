from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from src.database.base import Base


class Student(Base):
    __tablename__ = "students"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    shopkeeper_id: Mapped[UUID | None] = mapped_column(
        Uuid, ForeignKey("shopkeepers.id", ondelete="SET NULL"), unique=True, nullable=True, index=True
    )
    display_name: Mapped[str] = mapped_column(String(100))
    age: Mapped[int] = mapped_column(Integer)
    language: Mapped[str] = mapped_column(String(8), default="sw")
    difficulty_tier: Mapped[int] = mapped_column(Integer, default=2)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
