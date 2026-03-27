import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.document import FileType


class DocumentResponse(BaseModel):
    id: uuid.UUID
    name: str
    file_type: FileType
    storage_path: str | None = None
    source: str = "upload"
    extracted_text: str | None = None
    parsed_at: datetime | None = None
    created_at: datetime
    draft_id: uuid.UUID | None = None

    model_config = {"from_attributes": True}


class DocumentListResponse(BaseModel):
    items: list[DocumentResponse]
    total: int
    limit: int
    offset: int


class DocumentTextCreate(BaseModel):
    title: str = Field(min_length=1, max_length=512)
    text: str = Field(min_length=1)
