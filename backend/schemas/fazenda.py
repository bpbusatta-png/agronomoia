from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class FazendaBase(BaseModel):
    cooperado_id: Optional[UUID] = None
    nome: str
    municipio: Optional[str] = None
    area_ha: Optional[Decimal] = None


class FazendaCreate(FazendaBase):
    pass


class FazendaUpdate(BaseModel):
    cooperado_id: Optional[UUID] = None
    nome: Optional[str] = None
    municipio: Optional[str] = None
    area_ha: Optional[Decimal] = None


class FazendaRead(FazendaBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
