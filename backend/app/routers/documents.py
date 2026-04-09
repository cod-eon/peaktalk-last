import asyncio
import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Form, HTTPException, Query, Request, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.document import Document, FileType
from app.models.draft import SpeechDraft
from app.models.user import User
from app.schemas.document import DocumentListResponse, DocumentResponse, DocumentTextCreate
from app.services import parser, storage
from app.services.limits import check_document_limit, increment_document_counter

logger = logging.getLogger("peaktalk.documents")

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
    file_type: FileType = Form(FileType.other),
    _limit_check: None = Depends(check_document_limit),
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

    logger.info("Uploading document user=%s file=%s size=%d", current_user.id, filename, len(file_bytes))

    await storage.upload_file(file_bytes, storage_path, file.content_type or "application/octet-stream")

    doc = Document(
        id=document_id,
        owner_id=current_user.id,
        name=filename,
        storage_path=storage_path,
        file_type=file_type,
    )

    if storage.is_large_file(file_bytes):
        from app.worker import parse_document_task
        parse_document_task.delay(str(document_id))
        logger.info("Large file queued for async parsing document=%s", document_id)
    else:
        parse_result = await asyncio.to_thread(parser.parse_file, file_bytes, file_type, filename)
        if parse_result.text:
            doc.extracted_text = parse_result.text
            doc.parsed_at = datetime.now(timezone.utc)
            logger.info("Document parsed synchronously chars=%d", len(parse_result.text))

    try:
        db.add(doc)
        await db.flush()
        await db.refresh(doc)
    except Exception:
        logger.error("DB write failed for document=%s — rolling back storage", document_id)
        await storage.delete_file(storage_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save document record",
        )

    await increment_document_counter(str(current_user.id), db)
    return doc


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    request: Request,
    limit: int = Query(50, ge=1, le=200, description="Max items to return"),
    offset: int = Query(0, ge=0, description="Number of items to skip"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DocumentListResponse:
    total_result = await db.execute(
        select(func.count()).select_from(Document).where(Document.owner_id == current_user.id)
    )
    total = total_result.scalar_one()

    result = await db.execute(
        select(Document)
        .where(Document.owner_id == current_user.id)
        .order_by(Document.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    docs = list(result.scalars().all())

    # Fetch latest draft_id for each document
    draft_map: dict[uuid.UUID, uuid.UUID] = {}
    if docs:
        doc_ids = [d.id for d in docs]
        draft_rows = await db.execute(
            select(SpeechDraft.document_id, SpeechDraft.id)
            .where(
                SpeechDraft.user_id == current_user.id,
                SpeechDraft.document_id.in_(doc_ids),
            )
            .order_by(SpeechDraft.created_at.desc())
        )
        for row in draft_rows:
            if row.document_id not in draft_map:
                draft_map[row.document_id] = row.id

    items = []
    for doc in docs:
        dr = DocumentResponse(
            id=doc.id,
            name=doc.name,
            file_type=doc.file_type,
            storage_path=doc.storage_path,
            source=doc.source or "upload",
            extracted_text=doc.extracted_text,
            parsed_at=doc.parsed_at,
            created_at=doc.created_at,
            draft_id=draft_map.get(doc.id),
        )
        items.append(dr)

    # Standalone drafts (no document_id) — show as virtual documents
    standalone_result = await db.execute(
        select(SpeechDraft)
        .where(
            SpeechDraft.user_id == current_user.id,
            SpeechDraft.document_id.is_(None),
        )
        .order_by(SpeechDraft.created_at.desc())
    )
    standalone_drafts = list(standalone_result.scalars().all())
    for sd in standalone_drafts:
        items.append(DocumentResponse(
            id=sd.id,
            name=sd.title,
            file_type=FileType.other,
            storage_path=None,
            source="draft",
            extracted_text=None,
            parsed_at=None,
            created_at=sd.created_at,
            draft_id=sd.id,
        ))
    total += len(standalone_drafts)

    return DocumentListResponse(items=items, total=total, limit=limit, offset=offset)


@router.post("/from-text", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def create_text_document(
    request: Request,
    body: DocumentTextCreate,
    _limit_check: None = Depends(check_document_limit),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Document:
    """Create a text-only document (no file upload). Source = 'text'."""
    doc = Document(
        owner_id=current_user.id,
        name=body.title,
        storage_path=None,
        file_type=FileType.other,
        extracted_text=body.text,
        parsed_at=datetime.now(timezone.utc),
        source="text",
    )
    db.add(doc)
    await db.flush()
    await db.refresh(doc)
    await increment_document_counter(str(current_user.id), db)
    logger.info("Text document created user=%s doc=%s", current_user.id, doc.id)
    return doc


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

    if doc.storage_path:
        await storage.delete_file(doc.storage_path)
    await db.delete(doc)
    logger.info("Document deleted user=%s document=%s", current_user.id, document_id)
