from datetime import date
from decimal import Decimal
from typing import Any, Dict, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class AnaliseSoloBase(BaseModel):
    talhao_id: Optional[UUID] = None
    data: Optional[date] = None
    ph: Optional[Decimal] = None
    materia_organica: Optional[Decimal] = None
    nutrientes: Optional[Dict[str, Any]] = None


class AnaliseSoloCreate(AnaliseSoloBase):
    pass


class AnaliseSoloUpdate(AnaliseSoloBase):
    pass


class AnaliseSoloRead(AnaliseSoloBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
