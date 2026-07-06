from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class CultivarBase(BaseModel):
    nome: str
    empresa_id: Optional[UUID] = None
    especie: Optional[str] = None
    ciclo_dias: Optional[int] = None


class CultivarCreate(CultivarBase):
    pass


class CultivarUpdate(BaseModel):
    nome: Optional[str] = None
    empresa_id: Optional[UUID] = None
    especie: Optional[str] = None
    ciclo_dias: Optional[int] = None


class CultivarRead(CultivarBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
