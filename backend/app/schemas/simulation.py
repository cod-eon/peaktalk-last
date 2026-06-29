import uuid
from datetime import datetime
from typing import Any, Literal, Optional
from pydantic import BaseModel, Field, model_validator

from app.models.simulation import ArtifactType, MessageRole, SessionStatus


class PersonaConfig(BaseModel):
    source_type: Literal["system", "custom", "scenario", "guest"] = "system"
    role: str | None = Field(default=None, min_length=1, max_length=64, description="Persona role key or custom role label")
    industry: str = Field(default="general", max_length=100, description="e.g. fintech, edtech, healthcare")
    difficulty: int = Field(default=3, ge=1, le=5, description="1=easy, 5=brutal")
    persona_id: uuid.UUID | None = None
    persona_name: str | None = Field(default=None, max_length=128)
    persona_role_label: str | None = Field(default=None, max_length=128)
    background: str | None = None
    communication_style: str | None = None
    focus_areas: list[str] = []
    catch_phrases: list[str] = []
    age: int | None = None
    paid_access: bool | None = None
    max_turns: int | None = None
    scenario_id: str | None = None
    scenario_slug: str | None = None
    scenario_title: str | None = None
    case_context: dict[str, Any] | None = None


class SystemPersonaSelection(BaseModel):
    role: str = Field(min_length=1, max_length=50, description="Persona role key from /simulation/personas")


class SimulationStartRequest(BaseModel):
    source_type: Literal["system", "custom"]
    persona_config: SystemPersonaSelection | None = None
    persona_id: uuid.UUID | None = None
    industry: str = Field(default="general", max_length=100)
    difficulty: int | None = Field(default=None, ge=1, le=5)
    document_id: uuid.UUID | None = None
    draft_id: uuid.UUID | None = None
    meeting_id: Optional[uuid.UUID] = None

    @model_validator(mode="after")
    def validate_start_source(self) -> "SimulationStartRequest":
        if (self.document_id is None) == (self.draft_id is None):
            raise ValueError("Для стресс-теста нужно передать ровно один материал: document_id или draft_id.")
        if self.source_type == "system":
            if self.persona_config is None:
                raise ValueError("Для системного стресс-теста нужно передать persona_config.role.")
            if self.persona_id is not None:
                raise ValueError("persona_id нельзя передавать для системного стресс-теста.")
            if self.difficulty is None:
                raise ValueError("Для системного стресс-теста нужно передать difficulty.")
        if self.source_type == "custom":
            if self.persona_id is None:
                raise ValueError("Для кастомного стресс-теста нужно передать persona_id.")
            if self.persona_config is not None:
                raise ValueError("persona_config нельзя передавать для кастомного стресс-теста.")
            if self.difficulty is not None:
                raise ValueError("difficulty нельзя передавать для кастомного стресс-теста.")
        return self


class StartFromScenarioRequest(BaseModel):
    scenario_id: uuid.UUID
    difficulty: int = Field(default=3, ge=1, le=5)


class StartFromScenarioResponse(BaseModel):
    id: uuid.UUID


class SimulationRerunResponse(BaseModel):
    id: uuid.UUID


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
    pdf_available: bool = False


# ---------------------------------------------------------------------------
# Artifact schemas
# ---------------------------------------------------------------------------

class TopArgument(BaseModel):
    text: str
    strength: str  # "high" | "medium"
    anchor_phrase: str


class DangerZone(BaseModel):
    topic: str
    risk: str
    suggested_response: str


class PrepCardContent(BaseModel):
    top_arguments: list[TopArgument] = []
    anchor_phrases: list[str] = []
    danger_zones: list[DangerZone] = []
    key_numbers: list[str] = []
    evidence_gaps: list[str] = []
    pressure_questions: list[str] = []
    next_moves: list[str] = []
    opening_move: str = ""


class ArtifactPaywallTeaser(BaseModel):
    top_arguments_count: int
    anchor_phrases_preview: list[str]
    danger_zones_count: int


class ArtifactPaywall(BaseModel):
    message: str
    cta: str
    action: str


class SessionArtifactResponse(BaseModel):
    """Response from GET /simulation/{session_id}/artifact."""
    available: bool
    generating: bool = False
    artifact: PrepCardContent | None = None
    teaser: ArtifactPaywallTeaser | None = None
    paywall: ArtifactPaywall | None = None


class SendMessageRequest(BaseModel):
    content: str = Field(min_length=1, max_length=8000, description="User's answer to the AI question")


class SendMessageResponse(BaseModel):
    user_message: SimulationMessageResponse | None = None
    assistant_message: SimulationMessageResponse | None = None
    session_completed: bool = False
    ai_detected: bool = False

class StartFromGuestRequest(BaseModel):
    guest_session_id: str = Field(min_length=1, max_length=128)
    difficulty: int = Field(default=3, ge=1, le=5)

class StartFromGuestResponse(BaseModel):
    id: uuid.UUID
