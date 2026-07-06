from datetime import date
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class OcorrenciaPragaBase(BaseModel):
    fotografia_id: Optional[UUID] = None
    talhao_id: Optional[UUID] = None
    praga_id: Optional[UUID] = None
    estadio: Optional[str] = None
    populacao_estimada: Optional[Decimal] = None
    nivel_dano: Optional[str] = None
    nivel_controle: Optional[str] = None
    modelo_versao_id: Optional[UUID] = None
    confianca_modelo: Optional[Decimal] = None
    data: Optional[date] = None


class OcorrenciaPragaCreate(OcorrenciaPragaBase):
    pass


class OcorrenciaPragaUpdate(OcorrenciaPragaBase):
    # validado_por so e alteravel aqui; create_dep (Tecnico_Campo) nao
    # tem acesso a update_dep (Administrador/Agronomo_RT), entao um
    # tecnico nao consegue se autovalidar.
    validado_por: Optional[UUID] = None


class OcorrenciaPragaRead(OcorrenciaPragaBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    validado_por: Optional[UUID] = None
