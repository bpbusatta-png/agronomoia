from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ContratoBase(BaseModel):
    empresa_id: Optional[UUID] = None
    cultivar_id: Optional[UUID] = None
    cooperado_id: Optional[UUID] = None
    safra_id: Optional[UUID] = None
    area_contratada_ha: Optional[Decimal] = None
    area_plantada_ha: Optional[Decimal] = 0
    producao_prevista_kg: Optional[Decimal] = None
    status: str = "aberto"


class ContratoCreate(ContratoBase):
    pass


class ContratoUpdate(BaseModel):
    empresa_id: Optional[UUID] = None
    cultivar_id: Optional[UUID] = None
    cooperado_id: Optional[UUID] = None
    safra_id: Optional[UUID] = None
    area_contratada_ha: Optional[Decimal] = None
    area_plantada_ha: Optional[Decimal] = None
    producao_prevista_kg: Optional[Decimal] = None
    status: Optional[str] = None


class ContratoRead(ContratoBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
