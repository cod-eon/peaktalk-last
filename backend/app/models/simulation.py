import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import JSON

from app.database import Base


class ArtifactType(str, enum.Enum):
    prep_card = "prep_card"


class SessionStatus(str, enum.Enum):
    active = "active"
    completed = "completed"
    cancelled = "cancelled"


class MessageRole(str, enum.Enum):
    user = "user"
    assistant = "assistant"


class SimulationSession(Base):
    __tablename__ = "simulation_sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    document_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("documents.id", ondelete="SET NULL"), nullable=True
    )
    draft_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("speech_drafts.id", ondelete="SET NULL"), nullable=True
    )
    # {"role": "investor"|"hr"|"tech_lead"|"listener", "industry": str, "difficulty": 1-5}
    persona_config: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    status: Mapped[SessionStatus] = mapped_column(
        Enum(SessionStatus, name="session_status"), nullable=False, default=SessionStatus.active
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    messages: Mapped[list["SimulationMessage"]] = relationship(
        "SimulationMessage",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="SimulationMessage.turn_index",
    )
    skill_metrics: Mapped[list["SkillMetric"]] = relationship(
        "SkillMetric", back_populates="session", cascade="all, delete-orphan"
    )
    artifacts: Mapped[list["SessionArtifact"]] = relationship(
        "SessionArtifact", back_populates="session", cascade="all, delete-orphan"
    )


class SimulationMessage(Base):
    __tablename__ = "simulation_messages"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("simulation_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role: Mapped[MessageRole] = mapped_column(
        Enum(MessageRole, name="message_role"), nullable=False
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    internal_reasoning: Mapped[str | None] = mapped_column(Text, nullable=True)
    turn_index: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    session: Mapped["SimulationSession"] = relationship("SimulationSession", back_populates="messages")


class SkillMetric(Base):
    __tablename__ = "skill_metrics"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("simulation_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    metric_name: Mapped[str] = mapped_column(String(128), nullable=False)
    score: Mapped[float] = mapped_column(Float, nullable=False)  # 0.0 – 1.0
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)

    session: Mapped["SimulationSession"] = relationship("SimulationSession", back_populates="skill_metrics")


class SessionArtifact(Base):
    __tablename__ = "session_artifacts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("simulation_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    artifact_type: Mapped[ArtifactType] = mapped_column(
        Enum(ArtifactType, name="artifact_type"), nullable=False, default=ArtifactType.prep_card
    )
    # JSON content — structure varies by artifact_type; prep_card schema defined in services
    content: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    session: Mapped["SimulationSession"] = relationship("SimulationSession", back_populates="artifacts")
