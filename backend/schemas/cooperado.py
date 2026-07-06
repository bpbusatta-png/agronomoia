from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from schemas._geo import WKTGeometry


class CooperadoBase(BaseModel):
    codigo: str
    nome: str
    contato_telefone: Optional[str] = None
    contato_email: Optional[str] = None
    municipio: Optional[str] = None
    estado: Optional[str] = None
    localizacao: WKTGeometry = None


class CooperadoCreate(CooperadoBase):
    pass


class CooperadoUpdate(BaseModel):
    codigo: Optional[str] = None
    nome: Optional[str] = None
    contato_telefone: Optional[str] = None
    contato_email: Optional[str] = None
    municipio: Optional[str] = None
    estado: Optional[str] = None
    localizacao: WKTGeometry = None


class CooperadoRead(CooperadoBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    criado_em: datetime
