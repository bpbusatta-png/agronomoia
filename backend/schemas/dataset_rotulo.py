from datetime import datetime
from typing import Any, Dict, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class DatasetRotuloBase(BaseModel):
    fotografia_id: Optional[UUID] = None
    tipo_rotulo: Optional[str] = None
    rotulo_valor: Optional[Dict[str, Any]] = None


class DatasetRotuloCreate(DatasetRotuloBase):
    pass


class DatasetRotuloUpdate(BaseModel):
    tipo_rotulo: Optional[str] = None
    rotulo_valor: Optional[Dict[str, Any]] = None
    revisado_por: Optional[UUID] = None
    usado_em_treino: Optional[bool] = None


class DatasetRotuloRead(DatasetRotuloBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    rotulado_por: Optional[UUID] = None
    revisado_por: Optional[UUID] = None
    usado_em_treino: bool = False
    criado_em: datetime
