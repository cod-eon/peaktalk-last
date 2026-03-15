import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.document import FileType


class DocumentResponse(BaseModel):
    id: uuid.UUID
    name: str
    file_type: FileType
    storage_path: str
    extracted_text: str | None = None
    parsed_at: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class DocumentListResponse(BaseModel):
    items: list[DocumentResponse]
    total: int
    limit: int
    offset: int
