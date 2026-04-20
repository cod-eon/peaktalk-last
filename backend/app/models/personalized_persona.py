import uuid
from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class PersonalizedPersona(Base):
    __tablename__ = "personalized_personas"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    role: Mapped[str] = mapped_column(String(64), nullable=False)
    age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    background: Mapped[str | None] = mapped_column(Text, nullable=True)
    communication_style: Mapped[str] = mapped_column(Text, nullable=False, default="")
    catch_phrases: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    focus_areas: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    difficulty_hint: Mapped[int] = mapped_column(Integer, nullable=False, default=4)
    usage_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
