from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from schemas._geo import WKTGeometry


class FotografiaBase(BaseModel):
    talhao_id: Optional[UUID] = None
    inspecao_id: Optional[UUID] = None
    url_arquivo: str
    localizacao: WKTGeometry = None
    tipo: Optional[str] = None


class FotografiaCreate(FotografiaBase):
    pass


class FotografiaUpdate(BaseModel):
    talhao_id: Optional[UUID] = None
    inspecao_id: Optional[UUID] = None
    url_arquivo: Optional[str] = None
    localizacao: WKTGeometry = None
    tipo: Optional[str] = None


class FotografiaRead(FotografiaBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    usuario_id: Optional[UUID] = None
    capturado_em: datetime
