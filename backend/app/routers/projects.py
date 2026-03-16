import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import delete, func, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_user
from app.models.document import Document
from app.models.project import Project, project_document, project_simulation
from app.models.simulation import SimulationSession, SkillMetric
from app.models.user import User
from app.schemas.project import (
    LinkDocumentBody,
    LinkSimulationBody,
    LinkedDocumentResponse,
    LinkedSimulationResponse,
    ProjectCreate,
    ProjectDetailResponse,
    ProjectListResponse,
    ProjectResponse,
    ProjectUpdate,
)

logger = logging.getLogger("peaktalk.projects")

router = APIRouter(prefix="/projects", tags=["projects"])


def _compute_readiness(simulations: list) -> float | None:
    """Average of all skill metric scores across all linked completed simulations."""
    scores = []
    for sim in simulations:
        if sim.skill_metrics:
            scores.extend(m.score for m in sim.skill_metrics)
    return round(sum(scores) / len(scores), 3) if scores else None


def _sim_avg_score(sim: SimulationSession) -> float | None:
    if not sim.skill_metrics:
        return None
    scores = [m.score for m in sim.skill_metrics]
    return round(sum(scores) / len(scores), 3)


@router.get("", response_model=ProjectListResponse)
async def list_projects(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProjectListResponse:
    total_res = await db.execute(
        select(func.count()).select_from(Project).where(Project.user_id == current_user.id)
    )
    total = total_res.scalar_one()

    res = await db.execute(
        select(Project)
        .where(Project.user_id == current_user.id)
        .order_by(Project.created_at.desc())
        .limit(limit).offset(offset)
    )
    projects = list(res.scalars().all())

    items = []
    for p in projects:
        doc_count = (await db.execute(
            select(func.count()).select_from(project_document)
            .where(project_document.c.project_id == p.id)
        )).scalar_one()

        sim_count = (await db.execute(
            select(func.count()).select_from(project_simulation)
            .where(project_simulation.c.project_id == p.id)
        )).scalar_one()

        items.append(ProjectResponse(
            id=p.id,
            user_id=p.user_id,
            title=p.title,
            event_type=p.event_type,
            event_date=p.event_date,
            notes=p.notes,
            status="active",
            readiness_score=None,  # Computed only in detail view
            document_count=doc_count,
            simulation_count=sim_count,
            created_at=p.created_at,
            updated_at=p.updated_at,
        ))

    return ProjectListResponse(items=items, total=total)


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    body: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProjectResponse:
    project = Project(
        user_id=current_user.id,
        title=body.title,
        event_type=body.event_type,
        event_date=body.event_date,
        notes=body.notes,
    )
    db.add(project)
    await db.flush()
    await db.refresh(project)
    logger.info("Project created user=%s project=%s", current_user.id, project.id)
    return ProjectResponse(
        id=project.id,
        user_id=project.user_id,
        title=project.title,
        event_type=project.event_type,
        event_date=project.event_date,
        notes=project.notes,
        status="active",
        readiness_score=None,
        document_count=0,
        simulation_count=0,
        created_at=project.created_at,
        updated_at=project.updated_at,
    )


@router.get("/{project_id}", response_model=ProjectDetailResponse)
async def get_project(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProjectDetailResponse:
    res = await db.execute(
        select(Project)
        .options(
            selectinload(Project.documents),
            selectinload(Project.simulations).selectinload(SimulationSession.skill_metrics),
        )
        .where(Project.id == project_id, Project.user_id == current_user.id)
    )
    project = res.scalar_one_or_none()
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    readiness = _compute_readiness(project.simulations)

    return ProjectDetailResponse(
        id=project.id,
        user_id=project.user_id,
        title=project.title,
        event_type=project.event_type,
        event_date=project.event_date,
        notes=project.notes,
        status="active",
        readiness_score=readiness,
        document_count=len(project.documents),
        simulation_count=len(project.simulations),
        created_at=project.created_at,
        updated_at=project.updated_at,
        documents=[LinkedDocumentResponse.model_validate(d) for d in project.documents],
        simulations=[
            LinkedSimulationResponse(
                id=s.id,
                persona_config=s.persona_config,
                status=s.status.value if hasattr(s.status, "value") else s.status,
                created_at=s.created_at,
                avg_score=_sim_avg_score(s),
            )
            for s in project.simulations
        ],
    )


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: uuid.UUID,
    body: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProjectResponse:
    res = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    )
    project = res.scalar_one_or_none()
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(project, key, value)

    await db.flush()
    await db.refresh(project)
    return ProjectResponse(
        id=project.id,
        user_id=project.user_id,
        title=project.title,
        event_type=project.event_type,
        event_date=project.event_date,
        notes=project.notes,
        status="active",
        readiness_score=None,
        document_count=0,
        simulation_count=0,
        created_at=project.created_at,
        updated_at=project.updated_at,
    )


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    res = await db.execute(
        delete(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    )
    if res.rowcount == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")


@router.post("/{project_id}/documents/link", status_code=status.HTTP_200_OK)
async def link_document(
    project_id: uuid.UUID,
    body: LinkDocumentBody,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    p = (await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    )).scalar_one_or_none()
    if p is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    doc = (await db.execute(
        select(Document).where(Document.id == body.document_id, Document.owner_id == current_user.id)
    )).scalar_one_or_none()
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    await db.execute(
        pg_insert(project_document).values(
            project_id=project_id, document_id=body.document_id
        ).on_conflict_do_nothing()
    )
    return {"status": "ok"}


@router.post("/{project_id}/documents/unlink", status_code=status.HTTP_200_OK)
async def unlink_document(
    project_id: uuid.UUID,
    body: LinkDocumentBody,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    p = (await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    )).scalar_one_or_none()
    if p is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    await db.execute(
        delete(project_document).where(
            project_document.c.project_id == project_id,
            project_document.c.document_id == body.document_id,
        )
    )
    return {"status": "ok"}


@router.post("/{project_id}/simulations/link", status_code=status.HTTP_200_OK)
async def link_simulation(
    project_id: uuid.UUID,
    body: LinkSimulationBody,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    p = (await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    )).scalar_one_or_none()
    if p is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    sim = (await db.execute(
        select(SimulationSession).where(
            SimulationSession.id == body.simulation_id,
            SimulationSession.user_id == current_user.id,
        )
    )).scalar_one_or_none()
    if sim is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    await db.execute(
        pg_insert(project_simulation).values(
            project_id=project_id, simulation_id=body.simulation_id
        ).on_conflict_do_nothing()
    )
    return {"status": "ok"}


@router.post("/{project_id}/simulations/unlink", status_code=status.HTTP_200_OK)
async def unlink_simulation(
    project_id: uuid.UUID,
    body: LinkSimulationBody,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    p = (await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    )).scalar_one_or_none()
    if p is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    await db.execute(
        delete(project_simulation).where(
            project_simulation.c.project_id == project_id,
            project_simulation.c.simulation_id == body.simulation_id,
        )
    )
    return {"status": "ok"}
