from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class PlantaDaninhaCatalogoBase(BaseModel):
    nome_comum: Optional[str] = None
    nome_cientifico: Optional[str] = None
    ciclo: Optional[str] = None


class PlantaDaninhaCatalogoCreate(PlantaDaninhaCatalogoBase):
    pass


class PlantaDaninhaCatalogoUpdate(PlantaDaninhaCatalogoBase):
    pass


class PlantaDaninhaCatalogoRead(PlantaDaninhaCatalogoBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
