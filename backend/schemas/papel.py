from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class PapelBase(BaseModel):
    nome: str
    descricao: Optional[str] = None


class PapelCreate(PapelBase):
    pass


class PapelUpdate(BaseModel):
    nome: Optional[str] = None
    descricao: Optional[str] = None


class PapelRead(PapelBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
