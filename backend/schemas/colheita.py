from datetime import date
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ColheitaBase(BaseModel):
    talhao_id: Optional[UUID] = None
    safra_id: Optional[UUID] = None
    data: Optional[date] = None
    quantidade_kg: Optional[Decimal] = None
    umidade_colheita: Optional[Decimal] = None
    qualidade_semente: Optional[str] = None


class ColheitaCreate(ColheitaBase):
    pass


class ColheitaUpdate(ColheitaBase):
    pass


class ColheitaRead(ColheitaBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
