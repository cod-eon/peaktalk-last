import enum
import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import Column, DateTime, Enum, ForeignKey, String, Table, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class EventType(str, enum.Enum):
    interview = "interview"
    pitch = "pitch"
    talk = "talk"
    presentation = "presentation"
    other = "other"


# Association tables
project_document = Table(
    "project_documents",
    Base.metadata,
    Column("project_id", UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True),
    Column("document_id", UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), primary_key=True),
)

project_simulation = Table(
    "project_simulations",
    Base.metadata,
    Column("project_id", UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True),
    Column("simulation_id", UUID(as_uuid=True), ForeignKey("simulation_sessions.id", ondelete="CASCADE"), primary_key=True),
)


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    event_type: Mapped[EventType] = mapped_column(
        Enum(EventType, name="event_type"), nullable=False, default=EventType.other
    )
    event_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), onupdate=func.now(), server_default=func.now(), nullable=False
    )

    # Relationships — loaded explicitly via selectinload in routers
    documents: Mapped[List["Document"]] = relationship("Document", secondary=project_document)
    simulations: Mapped[List["SimulationSession"]] = relationship("SimulationSession", secondary=project_simulation)
