import uuid
from datetime import datetime, timezone

from celery import Celery
from celery.schedules import crontab
from sqlalchemy.pool import NullPool

from app.config import settings


def _make_session():
    """Create a fresh async engine + session per task to avoid event loop conflicts in Celery."""
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
    _engine = create_async_engine(settings.database_url, poolclass=NullPool)
    return async_sessionmaker(_engine, class_=AsyncSession, expire_on_commit=False)

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
        # Renew subscriptions and downgrade expired ones. Runs daily at 07:00 UTC.
        "renew-subscriptions": {
            "task": "app.worker.renew_subscriptions_task",
            "schedule": crontab(hour=7, minute=0),
        },
    },
)


@celery_app.task(bind=True, max_retries=3, default_retry_delay=10)
def parse_document_task(self, document_id: str) -> dict:
    """Heavy document parsing task for files > 10 MB or slow-parsing documents."""
    import asyncio

    from sqlalchemy import select

    from app.models.document import Document
    from app.services import parser, storage

    async def _run() -> dict:
        async with _make_session()() as db:
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

        async with _make_session()() as db:
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


# ---------------------------------------------------------------------------
# Subscription renewal & downgrade task
# ---------------------------------------------------------------------------


@celery_app.task(bind=True, name="app.worker.renew_subscriptions_task", max_retries=1, default_retry_delay=600)
def renew_subscriptions_task(self) -> dict:
    """Daily task: auto-renew active subscriptions and downgrade expired ones.

    Logic:
    1. Find paid subscriptions where period_end <= now + 1 day (due for renewal).
       - If has saved payment_method → attempt charge via YooKassa.
       - Charge success → webhook will activate the new period.
       - Charge failure → set status to past_due.
    2. Find past_due/cancelled subscriptions where period_end + grace(3d) < now.
       - Downgrade to starter, clear payment method.
    """
    import asyncio
    import logging

    from datetime import timedelta

    from sqlalchemy import and_, or_, select

    from app.models.subscription import (
        PlanType,
        Subscription,
        SubscriptionStatus,
    )
    from app.models.user import User
    from app.services.limits import GRACE_PERIOD_DAYS
    from app.services.yookassa_service import charge_recurring

    log = logging.getLogger("peaktalk.worker.renew")

    async def _run() -> dict:
        now = datetime.now(timezone.utc)
        renewal_cutoff = now + timedelta(days=1)
        grace_cutoff = now - timedelta(days=GRACE_PERIOD_DAYS)
        renewed = 0
        failed = 0
        downgraded = 0

        async with _make_session()() as db:
            # === Phase 1: Auto-renew subscriptions approaching period_end ===
            result = await db.execute(
                select(Subscription)
                .where(
                    and_(
                        Subscription.plan.in_([PlanType.pro, PlanType.team]),
                        Subscription.status == SubscriptionStatus.active,
                        Subscription.period_end.isnot(None),
                        Subscription.period_end <= renewal_cutoff,
                        Subscription.yookassa_payment_method_id.isnot(None),
                    )
                )
            )
            due_subs = list(result.scalars().all())
            log.info("renew_subscriptions: found %d subscriptions due for renewal", len(due_subs))

            for sub in due_subs:
                # Fetch user email for receipt
                user_result = await db.execute(
                    select(User).where(User.id == sub.user_id)
                )
                user = user_result.scalar_one_or_none()
                if not user:
                    log.warning("renew: user not found for subscription user_id=%s", sub.user_id)
                    continue

                idem_key = f"renew-{sub.id}-{sub.period_end.isoformat()}"
                try:
                    charge_result = await charge_recurring(
                        user_id=str(sub.user_id),
                        subscription_id=str(sub.id),
                        payment_method_id=sub.yookassa_payment_method_id,
                        plan=sub.plan,
                        customer_email=user.email,
                        idempotency_key=idem_key,
                    )
                    log.info(
                        "renew: charge initiated user_id=%s payment_id=%s status=%s",
                        sub.user_id, charge_result["payment_id"], charge_result["status"],
                    )
                    renewed += 1
                except Exception as exc:
                    log.error(
                        "renew: charge failed user_id=%s plan=%s err=%s",
                        sub.user_id, sub.plan.value, exc,
                    )
                    sub.status = SubscriptionStatus.past_due
                    failed += 1

            # === Phase 2: Retry past_due subscriptions still within grace ===
            result = await db.execute(
                select(Subscription)
                .where(
                    and_(
                        Subscription.plan.in_([PlanType.pro, PlanType.team]),
                        Subscription.status == SubscriptionStatus.past_due,
                        Subscription.period_end.isnot(None),
                        Subscription.period_end > grace_cutoff,
                        Subscription.yookassa_payment_method_id.isnot(None),
                    )
                )
            )
            past_due_subs = list(result.scalars().all())
            log.info("renew_subscriptions: found %d past_due subscriptions to retry", len(past_due_subs))

            for sub in past_due_subs:
                user_result = await db.execute(
                    select(User).where(User.id == sub.user_id)
                )
                user = user_result.scalar_one_or_none()
                if not user:
                    continue

                idem_key = f"retry-{sub.id}-{now.strftime('%Y%m%d')}"
                try:
                    charge_result = await charge_recurring(
                        user_id=str(sub.user_id),
                        subscription_id=str(sub.id),
                        payment_method_id=sub.yookassa_payment_method_id,
                        plan=sub.plan,
                        customer_email=user.email,
                        idempotency_key=idem_key,
                    )
                    log.info(
                        "renew: retry charge user_id=%s payment_id=%s status=%s",
                        sub.user_id, charge_result["payment_id"], charge_result["status"],
                    )
                    renewed += 1
                except Exception as exc:
                    log.warning(
                        "renew: retry failed user_id=%s err=%s (will retry tomorrow)",
                        sub.user_id, exc,
                    )
                    failed += 1

            # === Phase 3: Downgrade expired subscriptions past grace period ===
            result = await db.execute(
                select(Subscription)
                .where(
                    and_(
                        Subscription.plan.in_([PlanType.pro, PlanType.team]),
                        Subscription.period_end.isnot(None),
                        Subscription.period_end <= grace_cutoff,
                        or_(
                            Subscription.status == SubscriptionStatus.past_due,
                            Subscription.status == SubscriptionStatus.cancelled,
                        ),
                    )
                )
            )
            expired_subs = list(result.scalars().all())
            log.info("renew_subscriptions: found %d expired subscriptions to downgrade", len(expired_subs))

            for sub in expired_subs:
                sub.plan = PlanType.starter
                sub.status = SubscriptionStatus.active
                sub.period_end = None
                sub.yookassa_payment_method_id = None
                sub.yookassa_subscription_id = None
                downgraded += 1
                log.info("renew: downgraded to starter user_id=%s", sub.user_id)

            await db.commit()

        return {
            "renewed": renewed,
            "failed": failed,
            "downgraded": downgraded,
        }

    return asyncio.run(_run())
