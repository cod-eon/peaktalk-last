import uuid
from datetime import datetime, timezone

from celery import Celery
from celery.schedules import crontab

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
    beat_schedule={
        # Expire simulations abandoned for > 2 hours. Runs every 30 minutes.
        "expire-abandoned-simulations": {
            "task": "app.worker.expire_abandoned_sessions_task",
            "schedule": crontab(minute="*/30"),
        },
    },
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


@celery_app.task(bind=True, name="app.worker.expire_abandoned_sessions_task")
def expire_abandoned_sessions_task(self) -> dict:
    """
    Periodic cleanup: find simulation sessions that have been active for more
    than 2 hours (user closed tab without hitting /complete or /abandon).

    - Sessions with at least one user answer  → evaluate + mark completed
    - Sessions with zero user answers          → mark cancelled
    """
    import asyncio
    from datetime import timedelta

    from sqlalchemy import and_, select
    from sqlalchemy.orm import selectinload

    from app.database import AsyncSessionLocal
    from app.models.document import Document
    from app.models.draft import SpeechDraft
    from app.models.simulation import MessageRole, SessionStatus, SimulationMessage, SimulationSession, SkillMetric
    from app.models.user import User  # noqa: F401 — required so SQLAlchemy resolves Document→User FK
    from app.services.gemini import GeminiError
    from app.services.simulation_ai import evaluate_session

    async def _get_source_text(db, document_id, draft_id) -> str:
        if document_id:
            from sqlalchemy import select as _select
            res = await db.execute(_select(Document).where(Document.id == document_id))
            doc = res.scalar_one_or_none()
            if doc and doc.extracted_text:
                return doc.extracted_text
        if draft_id:
            res = await db.execute(_select(SpeechDraft).where(SpeechDraft.id == draft_id))
            draft = res.scalar_one_or_none()
            if draft:
                return draft.raw_text
        return ""

    async def _run() -> dict:
        import logging
        log = logging.getLogger("peaktalk.worker.expire")

        cutoff = datetime.now(timezone.utc) - timedelta(hours=2)
        finalized = 0
        cancelled = 0

        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(SimulationSession)
                .options(
                    selectinload(SimulationSession.messages),
                    selectinload(SimulationSession.skill_metrics),
                )
                .where(
                    and_(
                        SimulationSession.status == SessionStatus.active,
                        SimulationSession.created_at < cutoff,
                    )
                )
            )
            stale = list(result.scalars().all())
            log.info("expire_abandoned_sessions: found %d stale sessions", len(stale))

            for session in stale:
                user_msgs = [m for m in session.messages if m.role == MessageRole.user]
                # Skip if already has metrics (shouldn't happen, but be safe)
                if session.skill_metrics:
                    session.status = SessionStatus.completed
                    if not session.completed_at:
                        session.completed_at = datetime.now(timezone.utc)
                    finalized += 1
                    continue

                if user_msgs:
                    try:
                        doc_text = await _get_source_text(db, session.document_id, session.draft_id)
                        history = [{"role": m.role.value, "content": m.content} for m in session.messages]
                        evaluation = await evaluate_session(doc_text=doc_text, messages=history)
                        for metric in evaluation.metrics:
                            db.add(SkillMetric(
                                session_id=session.id,
                                metric_name=metric["name"],
                                score=metric["score"],
                                comment=metric.get("comment"),
                            ))
                        session.status = SessionStatus.completed
                        session.completed_at = datetime.now(timezone.utc)
                        finalized += 1
                        log.info("expire: finalized session=%s answers=%d", session.id, len(user_msgs))
                    except GeminiError as exc:
                        log.warning("expire: evaluation failed session=%s err=%s, marking cancelled", session.id, exc)
                        session.status = SessionStatus.cancelled
                        session.completed_at = datetime.now(timezone.utc)
                        cancelled += 1
                else:
                    session.status = SessionStatus.cancelled
                    session.completed_at = datetime.now(timezone.utc)
                    cancelled += 1
                    log.info("expire: cancelled empty session=%s", session.id)

            await db.commit()

        return {"stale_found": len(stale), "finalized": finalized, "cancelled": cancelled}

    return asyncio.run(_run())
