import uuid
from datetime import datetime
from pydantic import BaseModel, Field

from app.models.simulation import MessageRole, SessionStatus


class PersonaConfig(BaseModel):
    role: str = Field(min_length=1, max_length=50, description="Persona role key from /simulation/personas")
    industry: str = Field(default="general", max_length=100, description="e.g. fintech, edtech, healthcare")
    difficulty: int = Field(default=3, ge=1, le=5, description="1=easy, 5=brutal")


class SimulationStartRequest(BaseModel):
    persona_config: PersonaConfig
    document_id: uuid.UUID | None = None
    draft_id: uuid.UUID | None = None


class SkillMetricResponse(BaseModel):
    metric_name: str
    score: float
    comment: str | None = None

    model_config = {"from_attributes": True}


class SimulationMessageResponse(BaseModel):
    id: uuid.UUID
    role: MessageRole
    content: str
    internal_reasoning: str | None = None
    turn_index: int
    created_at: datetime

    model_config = {"from_attributes": True}


class SimulationSessionResponse(BaseModel):
    id: uuid.UUID
    persona_config: PersonaConfig
    status: SessionStatus
    created_at: datetime
    completed_at: datetime | None = None
    messages: list[SimulationMessageResponse] = []
    skill_metrics: list[SkillMetricResponse] = []

    model_config = {"from_attributes": True}


class SimulationSessionListItem(BaseModel):
    """Lightweight session summary for list views — no messages payload."""
    id: uuid.UUID
    persona_config: PersonaConfig
    status: SessionStatus
    created_at: datetime
    completed_at: datetime | None = None
    message_count: int = 0
    avg_score: float | None = None
    document_title: str | None = None

    model_config = {"from_attributes": True}


class SimulationSessionListResponse(BaseModel):
    items: list[SimulationSessionListItem]
    total: int


class SimulationReportResponse(SimulationSessionResponse):
    """Report response — extends session with resolved document title."""
    document_title: str | None = None


class SendMessageRequest(BaseModel):
    content: str = Field(min_length=1, max_length=8000, description="User's answer to the AI question")


class SendMessageResponse(BaseModel):
    user_message: SimulationMessageResponse | None = None
    assistant_message: SimulationMessageResponse | None = None
    session_completed: bool = False
    ai_detected: bool = False
