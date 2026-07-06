from datetime import date
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class NdviLeituraBase(BaseModel):
    talhao_id: Optional[UUID] = None
    data: Optional[date] = None
    fonte: Optional[str] = None
    ndvi_medio: Optional[Decimal] = None
    ndre_medio: Optional[Decimal] = None
    msavi_medio: Optional[Decimal] = None
    url_mapa: Optional[str] = None


class NdviLeituraCreate(NdviLeituraBase):
    pass


class NdviLeituraUpdate(NdviLeituraBase):
    pass


class NdviLeituraRead(NdviLeituraBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
