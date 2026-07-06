from datetime import date
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class InspecaoBase(BaseModel):
    talhao_id: Optional[UUID] = None
    data: date
    estadio_fenologico: Optional[str] = None
    observacoes: Optional[str] = None


class InspecaoCreate(InspecaoBase):
    pass


class InspecaoUpdate(BaseModel):
    talhao_id: Optional[UUID] = None
    data: Optional[date] = None
    estadio_fenologico: Optional[str] = None
    observacoes: Optional[str] = None


class InspecaoRead(InspecaoBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    usuario_id: Optional[UUID] = None
