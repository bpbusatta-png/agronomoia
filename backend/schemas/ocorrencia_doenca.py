from datetime import date
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class OcorrenciaDoencaBase(BaseModel):
    fotografia_id: Optional[UUID] = None
    talhao_id: Optional[UUID] = None
    doenca_id: Optional[UUID] = None
    severidade_percentual: Optional[Decimal] = None
    estadio_cultura: Optional[str] = None
    modelo_versao_id: Optional[UUID] = None
    confianca_modelo: Optional[Decimal] = None
    data: Optional[date] = None


class OcorrenciaDoencaCreate(OcorrenciaDoencaBase):
    pass


class OcorrenciaDoencaUpdate(OcorrenciaDoencaBase):
    validado_por: Optional[UUID] = None


class OcorrenciaDoencaRead(OcorrenciaDoencaBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    validado_por: Optional[UUID] = None
