from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class LogPredicaoIABase(BaseModel):
    modelo_versao_id: Optional[UUID] = None
    entidade_referenciada: Optional[str] = None
    entidade_id: Optional[UUID] = None
    entrada_resumo: Optional[Dict[str, Any]] = None
    saida_predita: Optional[Dict[str, Any]] = None
    confianca: Optional[Decimal] = None


class LogPredicaoIACreate(LogPredicaoIABase):
    pass


class LogPredicaoIARead(LogPredicaoIABase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    criado_em: datetime
