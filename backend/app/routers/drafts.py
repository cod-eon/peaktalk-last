import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from app.limiter import limiter
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_user
from app.models.draft import AIAnalysisResult, SpeechDraft
from app.models.user import User
from app.schemas.draft import AIAnalysisResultResponse, SpeechDraftCreate, SpeechDraftListResponse, SpeechDraftResponse
from app.services.gemini import GeminiError, analyze_draft

logger = logging.getLogger("peaktalk.drafts")

router = APIRouter(prefix="/drafts", tags=["drafts"])


@router.get("", response_model=SpeechDraftListResponse)
async def list_drafts(
    request: Request,
    limit: int = Query(50, ge=1, le=200, description="Max items to return"),
    offset: int = Query(0, ge=0, description="Number of items to skip"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SpeechDraftListResponse:
    total_result = await db.execute(
        select(func.count()).select_from(SpeechDraft).where(SpeechDraft.user_id == current_user.id)
    )
    total = total_result.scalar_one()

    result = await db.execute(
        select(SpeechDraft)
        .options(selectinload(SpeechDraft.analysis_result))
        .where(SpeechDraft.user_id == current_user.id)
        .order_by(SpeechDraft.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    drafts = list(result.scalars().all())
    return SpeechDraftListResponse(items=drafts, total=total, limit=limit, offset=offset)


@router.post("", response_model=SpeechDraftResponse, status_code=status.HTTP_201_CREATED)
async def create_draft(
    request: Request,
    body: SpeechDraftCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SpeechDraft:
    draft = SpeechDraft(
        user_id=current_user.id,
        title=body.title,
        raw_text=body.raw_text,
        document_id=body.document_id,
    )
    db.add(draft)
    await db.flush()
    await db.refresh(draft, ["analysis_result"])
    logger.info("Draft created user=%s draft=%s", current_user.id, draft.id)
    return draft


@router.post("/{draft_id}/analyze", response_model=AIAnalysisResultResponse)
@limiter.limit("5/minute")
async def analyze_draft_endpoint(
    request: Request,
    draft_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AIAnalysisResult:
    result = await db.execute(
        select(SpeechDraft)
        .options(selectinload(SpeechDraft.analysis_result))
        .where(SpeechDraft.id == draft_id, SpeechDraft.user_id == current_user.id)
    )
    draft = result.scalar_one_or_none()

    if draft is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Draft not found")

    if draft.analysis_result is not None:
        logger.info("Returning cached analysis draft=%s", draft_id)
        return draft.analysis_result

    logger.info("Starting Gemini analysis draft=%s chars=%d", draft_id, len(draft.raw_text))
    profile = current_user.onboarding_profile
    user_context = {"segment": profile.segment.value, "goal": profile.primary_goal.value} if profile else None
    try:
        gemini_result = await analyze_draft(draft.raw_text, user_context=user_context)
    except GeminiError as exc:
        logger.error("Gemini analysis failed draft=%s error=%s", draft_id, exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI analysis failed: {exc}",
        ) from exc

    analysis = AIAnalysisResult(
        draft_id=draft.id,
        improved_text=gemini_result.improved_text,
        feedback_json=gemini_result.feedback,
    )
    db.add(analysis)
    await db.flush()
    await db.refresh(analysis)
    logger.info("Analysis saved draft=%s score=%s", draft_id, gemini_result.feedback.get("overall_score"))
    return analysis


@router.get("/{draft_id}", response_model=SpeechDraftResponse)
async def get_draft(
    request: Request,
    draft_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SpeechDraft:
    result = await db.execute(
        select(SpeechDraft)
        .options(selectinload(SpeechDraft.analysis_result))
        .where(SpeechDraft.id == draft_id, SpeechDraft.user_id == current_user.id)
    )
    draft = result.scalar_one_or_none()
    if draft is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Draft not found")
    return draft


@router.get("/{draft_id}/analysis", response_model=AIAnalysisResultResponse)
async def get_analysis(
    request: Request,
    draft_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AIAnalysisResult:
    result = await db.execute(
        select(SpeechDraft)
        .options(selectinload(SpeechDraft.analysis_result))
        .where(SpeechDraft.id == draft_id, SpeechDraft.user_id == current_user.id)
    )
    draft = result.scalar_one_or_none()
    if draft is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Draft not found")
    if draft.analysis_result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not yet available. Call POST /drafts/{id}/analyze first.",
        )
    return draft.analysis_result
