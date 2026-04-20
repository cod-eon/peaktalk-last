import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.personalized_persona import PersonalizedPersona
from app.models.user import User

router = APIRouter(prefix="/personas", tags=["personas"])


@router.get("")
async def list_personas(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    result = await db.execute(
        select(PersonalizedPersona)
        .where(PersonalizedPersona.user_id == current_user.id)
        .order_by(PersonalizedPersona.usage_count.desc(), PersonalizedPersona.created_at.desc())
    )
    personas = result.scalars().all()
    return [
        {
            "id": str(p.id),
            "name": p.name,
            "role": p.role,
            "age": p.age,
            "background": p.background,
            "communication_style": p.communication_style,
            "catch_phrases": p.catch_phrases,
            "focus_areas": p.focus_areas,
            "difficulty_hint": p.difficulty_hint,
            "usage_count": p.usage_count,
        }
        for p in personas
    ]


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_persona(
    request: Request,
    body: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    required = ["name", "role", "communication_style"]
    for f in required:
        if f not in body:
            raise HTTPException(status_code=422, detail=f"Missing field: {f}")

    persona = PersonalizedPersona(
        user_id=current_user.id,
        name=body["name"][:128],
        role=body["role"][:64],
        age=body.get("age"),
        background=body.get("background", ""),
        communication_style=body["communication_style"],
        catch_phrases=body.get("catch_phrases", []),
        focus_areas=body.get("focus_areas", []),
        difficulty_hint=body.get("difficulty_hint", 4),
    )
    db.add(persona)
    await db.flush()

    return {
        "id": str(persona.id),
        "name": persona.name,
        "role": persona.role,
    }


@router.patch("/{persona_id}")
async def update_persona(
    request: Request,
    persona_id: uuid.UUID,
    body: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(
        select(PersonalizedPersona).where(
            PersonalizedPersona.id == persona_id,
            PersonalizedPersona.user_id == current_user.id,
        )
    )
    persona = result.scalar_one_or_none()
    if not persona:
        raise HTTPException(status_code=404, detail="Персона не найдена")

    for field in ("name", "role", "age", "background", "communication_style", "difficulty_hint"):
        if field in body:
            setattr(persona, field, body[field])
    if "catch_phrases" in body:
        persona.catch_phrases = body["catch_phrases"]
    if "focus_areas" in body:
        persona.focus_areas = body["focus_areas"]

    await db.flush()
    return {"id": str(persona.id), "name": persona.name}


@router.delete("/{persona_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_persona(
    request: Request,
    persona_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    result = await db.execute(
        select(PersonalizedPersona).where(
            PersonalizedPersona.id == persona_id,
            PersonalizedPersona.user_id == current_user.id,
        )
    )
    persona = result.scalar_one_or_none()
    if not persona:
        raise HTTPException(status_code=404, detail="Персона не найдена")
    await db.delete(persona)
