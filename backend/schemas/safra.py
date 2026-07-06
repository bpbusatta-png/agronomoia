from datetime import date
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class SafraBase(BaseModel):
    nome: str
    data_inicio: Optional[date] = None
    data_fim: Optional[date] = None


class SafraCreate(SafraBase):
    pass


class SafraUpdate(BaseModel):
    nome: Optional[str] = None
    data_inicio: Optional[date] = None
    data_fim: Optional[date] = None


class SafraRead(SafraBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
