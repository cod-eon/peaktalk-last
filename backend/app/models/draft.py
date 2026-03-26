import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, JSON, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class SpeechDraft(Base):
    __tablename__ = "speech_drafts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    document_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=True
    )
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    raw_text: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    analysis_result: Mapped["AIAnalysisResult | None"] = relationship(
        "AIAnalysisResult", back_populates="draft", uselist=False, cascade="all, delete-orphan"
    )


class AIAnalysisResult(Base):
    __tablename__ = "ai_analysis_results"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    draft_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("speech_drafts.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    improved_text: Mapped[str] = mapped_column(Text, nullable=False)
    # Structure: {logic: str, style: str, clarity: str, grammar: str, overall_score: int}
    # JSON type works with SQLite (tests) and PostgreSQL (prod); use JSONB in migration for PG
    feedback_json: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    draft: Mapped["SpeechDraft"] = relationship("SpeechDraft", back_populates="analysis_result")
