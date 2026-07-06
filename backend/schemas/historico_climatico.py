from datetime import date
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class HistoricoClimaticoBase(BaseModel):
    talhao_id: Optional[UUID] = None
    data: date
    chuva_mm: Optional[Decimal] = None
    temp_min: Optional[Decimal] = None
    temp_max: Optional[Decimal] = None
    umidade_relativa: Optional[Decimal] = None


class HistoricoClimaticoCreate(HistoricoClimaticoBase):
    pass


class HistoricoClimaticoUpdate(BaseModel):
    talhao_id: Optional[UUID] = None
    data: Optional[date] = None
    chuva_mm: Optional[Decimal] = None
    temp_min: Optional[Decimal] = None
    temp_max: Optional[Decimal] = None
    umidade_relativa: Optional[Decimal] = None


class HistoricoClimaticoRead(HistoricoClimaticoBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
