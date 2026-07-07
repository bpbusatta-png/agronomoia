from datetime import date
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class OcorrenciaPlantaDaninhaBase(BaseModel):
    fotografia_id: Optional[UUID] = None
    talhao_id: Optional[UUID] = None
    planta_daninha_id: Optional[UUID] = None
    nivel_infestacao: Optional[str] = None
    estadio_cultura: Optional[str] = None
    modelo_versao_id: Optional[UUID] = None
    confianca_modelo: Optional[Decimal] = None
    data: Optional[date] = None


class OcorrenciaPlantaDaninhaCreate(OcorrenciaPlantaDaninhaBase):
    pass


class OcorrenciaPlantaDaninhaUpdate(OcorrenciaPlantaDaninhaBase):
    # validado_por so e alteravel aqui; create_dep (Tecnico_Campo) nao
    # tem acesso a update_dep (Administrador/Agronomo_RT), entao um
    # tecnico nao consegue se autovalidar. Mesmo padrao de ocorrencia_praga.py.
    validado_por: Optional[UUID] = None


class OcorrenciaPlantaDaninhaRead(OcorrenciaPlantaDaninhaBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    validado_por: Optional[UUID] = None
