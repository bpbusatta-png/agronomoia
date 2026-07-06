from datetime import date
from typing import Any, Dict, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ModeloVersaoBase(BaseModel):
    tipo_modelo: Optional[str] = None
    versao: Optional[str] = None
    data_treino: Optional[date] = None
    metricas_validacao: Optional[Dict[str, Any]] = None
    em_producao: bool = False


class ModeloVersaoCreate(ModeloVersaoBase):
    pass


class ModeloVersaoUpdate(ModeloVersaoBase):
    em_producao: Optional[bool] = None


class ModeloVersaoRead(ModeloVersaoBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
