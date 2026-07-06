from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from schemas._geo import WKTGeometry


class TalhaoBase(BaseModel):
    fazenda_id: Optional[UUID] = None
    codigo: str
    area_ha: Optional[Decimal] = None
    contorno: WKTGeometry = None
    empresa_id: Optional[UUID] = None
    cultivar_id: Optional[UUID] = None
    safra_id: Optional[UUID] = None
    classe_semente: Optional[str] = None
    data_plantio: Optional[date] = None


class TalhaoCreate(TalhaoBase):
    pass


class TalhaoUpdate(BaseModel):
    fazenda_id: Optional[UUID] = None
    codigo: Optional[str] = None
    area_ha: Optional[Decimal] = None
    contorno: WKTGeometry = None
    empresa_id: Optional[UUID] = None
    cultivar_id: Optional[UUID] = None
    safra_id: Optional[UUID] = None
    classe_semente: Optional[str] = None
    data_plantio: Optional[date] = None


class TalhaoRead(TalhaoBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    criado_em: datetime
