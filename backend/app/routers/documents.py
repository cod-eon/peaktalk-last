import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.document import Document, FileType
from app.models.user import User
from app.schemas.document import DocumentListResponse, DocumentResponse
from app.services import parser, storage

ALLOWED_CONTENT_TYPES = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/msword": "doc",
    "text/plain": "txt",
}

MAX_UPLOAD_SIZE = 50 * 1024 * 1024  # 50 MB hard limit

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    request: Request,
    file: UploadFile,
    file_type: FileType = FileType.other,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Document:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type: {file.content_type}. Allowed: PDF, DOCX, TXT",
        )

    file_bytes = await file.read()

    if len(file_bytes) > MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File exceeds 50 MB limit",
        )

    document_id = uuid.uuid4()
    filename = file.filename or f"{document_id}.bin"
    storage_path = storage.build_storage_path(current_user.id, document_id, filename)

    storage.upload_file(file_bytes, storage_path, file.content_type or "application/octet-stream")

    doc = Document(
        id=document_id,
        owner_id=current_user.id,
        name=filename,
        storage_path=storage_path,
        file_type=file_type,
    )

    # Lazy parse: handle synchronously for small files, offload to Celery for large ones
    if storage.is_large_file(file_bytes):
        from app.worker import parse_document_task
        parse_document_task.delay(str(document_id))
    else:
        parse_result = parser.parse_file(file_bytes, file_type, filename)
        if parse_result.was_slow:
            # Retroactively offload — document already parsed but flag for future large files
            pass
        if parse_result.text:
            doc.extracted_text = parse_result.text
            doc.parsed_at = datetime.now(timezone.utc)

    db.add(doc)
    await db.flush()
    await db.refresh(doc)
    return doc


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DocumentListResponse:
    result = await db.execute(
        select(Document)
        .where(Document.owner_id == current_user.id)
        .order_by(Document.created_at.desc())
    )
    docs = list(result.scalars().all())
    return DocumentListResponse(items=docs, total=len(docs))


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    request: Request,
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    result = await db.execute(
        select(Document).where(
            Document.id == document_id, Document.owner_id == current_user.id
        )
    )
    doc = result.scalar_one_or_none()
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    storage.delete_file(doc.storage_path)
    await db.delete(doc)
