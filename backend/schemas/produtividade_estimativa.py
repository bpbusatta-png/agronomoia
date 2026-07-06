from datetime import date
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ProdutividadeEstimativaBase(BaseModel):
    talhao_id: Optional[UUID] = None
    safra_id: Optional[UUID] = None
    populacao_plantas_ha: Optional[Decimal] = None
    vagens_por_planta: Optional[Decimal] = None
    graos_por_vagem: Optional[Decimal] = None
    pmg: Optional[Decimal] = None
    produtividade_estimada_kg_ha: Optional[Decimal] = None
    intervalo_confianca_min: Optional[Decimal] = None
    intervalo_confianca_max: Optional[Decimal] = None
    data: Optional[date] = None


class ProdutividadeEstimativaCreate(ProdutividadeEstimativaBase):
    pass


class ProdutividadeEstimativaUpdate(ProdutividadeEstimativaBase):
    pass


class ProdutividadeEstimativaRead(ProdutividadeEstimativaBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
