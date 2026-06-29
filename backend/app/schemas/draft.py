import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class AnnotationItem(BaseModel):
    text: str = Field(description="Exact verbatim substring from the original text")
    issue_type: Literal["logic", "style", "clarity", "grammar"]
    comment: str = Field(description="Specific, actionable recommendation")
    severity: Literal["high", "medium", "low"] = "medium"


class DefenseBrief(BaseModel):
    evidence_gaps: list[str] = Field(default_factory=list, description="Weak evidence, metrics, assumptions, or missing owners")
    pressure_questions: list[str] = Field(default_factory=list, description="Likely questions or objections from the opponent")
    next_moves: list[str] = Field(default_factory=list, description="Concrete edits or checks before the real meeting")


class DraftCaseContext(BaseModel):
    situation_id: str = Field(min_length=1, max_length=64)
    situation_label: str = Field(min_length=1, max_length=128)
    opponent_role: str | None = Field(default=None, max_length=128)
    desired_output: Literal["pressure_scan", "full_rewrite", "brief", "rehearsal"] = "pressure_scan"
    stakes: str | None = Field(default=None, max_length=500)
    success_criteria: str | None = Field(default=None, max_length=500)


class AnalysisFeedback(BaseModel):
    logic: str = Field(description="Pressure scan of evidence, metrics, trade-offs, and decision ownership")
    style: str = Field(description="Assessment of tone under executive/customer/investor pressure")
    clarity: str = Field(description="Assessment of ask, decision, next step, and success criteria")
    grammar: str = Field(description="Language precision issues that could reduce trust or create ambiguity")
    overall_score: int = Field(ge=1, le=10, description="Overall quality score 1-10")
    annotations: list[AnnotationItem] = Field(default_factory=list, description="Fragment-level issue annotations")
    defense_brief: DefenseBrief | None = Field(default=None, description="Meeting defense artifact for the analyzed material")


class AIAnalysisResultResponse(BaseModel):
    id: uuid.UUID
    draft_id: uuid.UUID
    improved_text: str
    feedback_json: AnalysisFeedback
    created_at: datetime

    model_config = {"from_attributes": True}


class SpeechDraftResponse(BaseModel):
    id: uuid.UUID
    title: str
    raw_text: str
    document_id: uuid.UUID | None = None
    case_context: DraftCaseContext | None = None
    created_at: datetime
    analysis_result: AIAnalysisResultResponse | None = None

    model_config = {"from_attributes": True}


class SpeechDraftListResponse(BaseModel):
    items: list[SpeechDraftResponse]
    total: int
    limit: int
    offset: int


class SpeechDraftCreate(BaseModel):
    title: str = Field(min_length=1, max_length=512)
    raw_text: str = Field(min_length=10, max_length=50_000, description="Meeting material to analyze (min 10 chars)")
    document_id: uuid.UUID | None = None
    case_context: DraftCaseContext | None = None
