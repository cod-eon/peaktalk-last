import enum
import uuid
from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, Enum, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ScenarioCategory(str, enum.Enum):
    budget = "budget"
    roadmap = "roadmap"
    investors = "investors"
    clients = "clients"
    people = "people"
    crisis = "crisis"


class Scenario(Base):
    __tablename__ = "scenarios"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug: Mapped[str] = mapped_column(String(128), unique=True, nullable=False, index=True)
    category: Mapped[ScenarioCategory] = mapped_column(
        Enum(ScenarioCategory, name="scenario_category"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(256), nullable=False)
    subtitle: Mapped[str] = mapped_column(String(512), nullable=False)
    situation: Mapped[str] = mapped_column(Text, nullable=False)
    simulation_context: Mapped[str] = mapped_column(Text, nullable=False)
    recommended_persona: Mapped[str] = mapped_column(String(64), nullable=False)
    recommended_difficulty: Mapped[int] = mapped_column(Integer, nullable=False, default=3)
    tags: Mapped[list[str]] = mapped_column(
        ARRAY(String).with_variant(JSON, "sqlite"),
        nullable=False,
        default=list,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")
    is_featured: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
