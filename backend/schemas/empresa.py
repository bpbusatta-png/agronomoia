from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class EmpresaBase(BaseModel):
    nome: str
    cnpj: Optional[str] = None
    contato: Optional[str] = None


class EmpresaCreate(EmpresaBase):
    pass


class EmpresaUpdate(BaseModel):
    nome: Optional[str] = None
    cnpj: Optional[str] = None
    contato: Optional[str] = None


class EmpresaRead(EmpresaBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
