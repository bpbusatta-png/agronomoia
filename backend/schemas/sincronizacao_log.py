from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class SincronizacaoLogBase(BaseModel):
    dispositivo_id: Optional[str] = None
    entidade_referenciada: Optional[str] = None
    entidade_id: Optional[UUID] = None
    operacao: Optional[str] = None
    timestamp_local: Optional[datetime] = None


class SincronizacaoLogCreate(SincronizacaoLogBase):
    pass


class SincronizacaoLogUpdate(BaseModel):
    status_conflito: Optional[str] = None


class SincronizacaoLogRead(SincronizacaoLogBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    usuario_id: Optional[UUID] = None
    timestamp_servidor: datetime
    status_conflito: str = "ok"
