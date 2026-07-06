from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class PragaCatalogoBase(BaseModel):
    nome_comum: Optional[str] = None
    nome_cientifico: Optional[str] = None
    grupo_irac_recomendado: Optional[str] = None


class PragaCatalogoCreate(PragaCatalogoBase):
    pass


class PragaCatalogoUpdate(PragaCatalogoBase):
    pass


class PragaCatalogoRead(PragaCatalogoBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
