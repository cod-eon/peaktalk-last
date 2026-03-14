import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class AnalysisFeedback(BaseModel):
    logic: str = Field(description="Assessment of logical structure and flow")
    style: str = Field(description="Assessment of writing style and tone")
    clarity: str = Field(description="Assessment of clarity and conciseness")
    grammar: str = Field(description="Assessment of grammar and language correctness")
    overall_score: int = Field(ge=1, le=10, description="Overall quality score 1-10")


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
    created_at: datetime
    analysis_result: AIAnalysisResultResponse | None = None

    model_config = {"from_attributes": True}


class SpeechDraftCreate(BaseModel):
    title: str = Field(min_length=1, max_length=512)
    raw_text: str = Field(min_length=10, description="Speech text to analyze (min 10 chars)")
    document_id: uuid.UUID | None = None
