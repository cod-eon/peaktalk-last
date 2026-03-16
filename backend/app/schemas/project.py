import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.project import EventType


class ProjectCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    event_type: EventType = EventType.other
    event_date: Optional[datetime] = None
    notes: Optional[str] = Field(None, max_length=2000)


class ProjectUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    event_type: Optional[EventType] = None
    event_date: Optional[datetime] = None
    notes: Optional[str] = Field(None, max_length=2000)


class LinkedDocumentResponse(BaseModel):
    id: uuid.UUID
    name: str
    file_type: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class LinkedSimulationResponse(BaseModel):
    id: uuid.UUID
    persona_config: dict
    status: str
    created_at: datetime
    avg_score: Optional[float] = None

    model_config = {"from_attributes": True}


class ProjectResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    event_type: EventType
    event_date: Optional[datetime] = None
    notes: Optional[str] = None
    status: str = "active"
    readiness_score: Optional[float] = None
    document_count: int = 0
    simulation_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProjectDetailResponse(ProjectResponse):
    documents: list[LinkedDocumentResponse] = []
    simulations: list[LinkedSimulationResponse] = []


class ProjectListResponse(BaseModel):
    items: list[ProjectResponse]
    total: int


# Body schemas for link/unlink endpoints
class LinkDocumentBody(BaseModel):
    document_id: uuid.UUID


class LinkSimulationBody(BaseModel):
    simulation_id: uuid.UUID
