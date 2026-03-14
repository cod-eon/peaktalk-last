import uuid

from celery import Celery

from app.config import settings

celery_app = Celery(
    "peaktalk",
    broker=settings.redis_url,
    backend=settings.redis_url,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)


@celery_app.task(bind=True, max_retries=3, default_retry_delay=10)
def parse_document_task(self, document_id: str) -> dict:
    """Heavy document parsing task for files > 10 MB or slow-parsing documents."""
    import asyncio

    from sqlalchemy import select

    from app.database import AsyncSessionLocal
    from app.models.document import Document
    from app.services import parser, storage

    async def _run() -> dict:
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(Document).where(Document.id == uuid.UUID(document_id))
            )
            doc = result.scalar_one_or_none()
            if doc is None:
                return {"status": "not_found", "document_id": document_id}

            if doc.parsed_at is not None:
                return {"status": "already_parsed", "document_id": document_id}

            file_bytes = storage.download_file(doc.storage_path)
            parse_result = parser.parse_file(file_bytes, doc.file_type, doc.name)

            from datetime import datetime, timezone

            doc.extracted_text = parse_result.text
            doc.parsed_at = datetime.now(timezone.utc)
            await db.commit()

        return {"status": "parsed", "document_id": document_id, "chars": len(parse_result.text)}

    return asyncio.run(_run())
