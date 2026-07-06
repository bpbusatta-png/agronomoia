from datetime import date
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class PlantaAtipicaOcorrenciaBase(BaseModel):
    fotografia_id: Optional[UUID] = None
    talhao_id: Optional[UUID] = None
    caracteristica_avaliada: Optional[str] = None
    conforme_padrao: Optional[bool] = None
    justificativa_tecnica: Optional[str] = None
    recomendacao: Optional[str] = None
    modelo_versao_id: Optional[UUID] = None
    confianca_modelo: Optional[Decimal] = None
    data: Optional[date] = None


# validado_por e status nunca sao aceitos do cliente (nem em create, nem em
# update) -- nascem 'pendente_validacao'/NULL e so mudam via POST .../validar,
# restrito a Administrador/Agronomo_RT. Ver core/roles.py e api/routes/inteligencia.py.


class PlantaAtipicaOcorrenciaCreate(PlantaAtipicaOcorrenciaBase):
    pass


class PlantaAtipicaOcorrenciaUpdate(PlantaAtipicaOcorrenciaBase):
    pass


class PlantaAtipicaOcorrenciaRead(PlantaAtipicaOcorrenciaBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    validado_por: Optional[UUID] = None
    status: str


class ValidarPlantaAtipicaRequest(BaseModel):
    decisao: str  # manter, eliminar
    justificativa: Optional[str] = None
