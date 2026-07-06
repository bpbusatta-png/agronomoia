from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class DoencaCatalogoBase(BaseModel):
    nome: Optional[str] = None
    grupo_frac_recomendado: Optional[str] = None


class DoencaCatalogoCreate(DoencaCatalogoBase):
    pass


class DoencaCatalogoUpdate(DoencaCatalogoBase):
    pass


class DoencaCatalogoRead(DoencaCatalogoBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
