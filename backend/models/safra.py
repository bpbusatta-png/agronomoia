import uuid

from sqlalchemy import Column, Date, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from core.database import Base


class Safra(Base):
    __tablename__ = "safras"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nome = Column(String(20), nullable=False)
    data_inicio = Column(Date)
    data_fim = Column(Date)
