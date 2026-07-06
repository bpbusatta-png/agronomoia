from datetime import date
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ConsentimentoLgpdBase(BaseModel):
    cooperado_id: Optional[UUID] = None
    finalidade: Optional[str] = None
    base_legal: Optional[str] = None
    data_consentimento: Optional[date] = None
    data_expiracao: Optional[date] = None


class ConsentimentoLgpdCreate(ConsentimentoLgpdBase):
    pass


class ConsentimentoLgpdUpdate(ConsentimentoLgpdBase):
    pass


class ConsentimentoLgpdRead(ConsentimentoLgpdBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
