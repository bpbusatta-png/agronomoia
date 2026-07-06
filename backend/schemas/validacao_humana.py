from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ValidacaoHumanaRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    entidade_referenciada: Optional[str] = None
    entidade_id: Optional[UUID] = None
    usuario_validador_id: Optional[UUID] = None
    decisao: Optional[str] = None
    justificativa: Optional[str] = None
    criado_em: datetime
