import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.simulation import MessageRole, SessionStatus


class PersonaConfig(BaseModel):
    role: str = Field(description="investor | hr | tech_lead | listener")
    industry: str = Field(default="general", description="e.g. fintech, edtech, healthcare")
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


class SendMessageRequest(BaseModel):
    content: str = Field(min_length=1, description="User's answer to the AI question")


class SendMessageResponse(BaseModel):
    user_message: SimulationMessageResponse
    assistant_message: SimulationMessageResponse
