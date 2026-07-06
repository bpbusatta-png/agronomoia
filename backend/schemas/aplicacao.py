from datetime import date
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class AplicacaoBase(BaseModel):
    talhao_id: Optional[UUID] = None
    produto: Optional[str] = None
    ingrediente_ativo: Optional[str] = None
    dose: Optional[Decimal] = None
    data: Optional[date] = None
    volume_calda_l_ha: Optional[Decimal] = None
    tecnologia_aplicacao: Optional[str] = None


class AplicacaoCreate(AplicacaoBase):
    pass


class AplicacaoUpdate(AplicacaoBase):
    pass


class AplicacaoRead(AplicacaoBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
