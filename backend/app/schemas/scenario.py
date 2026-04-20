import uuid

from pydantic import BaseModel


class ScenarioListItemResponse(BaseModel):
    id: uuid.UUID
    slug: str
    title: str
    subtitle: str
    category: str
    persona: str
    difficulty: int
    recommended_difficulty: int | None = None


class ScenarioDetailResponse(ScenarioListItemResponse):
    situation: str


class ScenarioCategoryResponse(BaseModel):
    id: str
    label: str
    count: int


class ScenariosListResponse(BaseModel):
    items: list[ScenarioListItemResponse]
    total: int
