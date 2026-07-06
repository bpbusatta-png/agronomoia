import uuid

from sqlalchemy import Column, Date, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from core.database import Base


class HistoricoClimatico(Base):
    __tablename__ = "historico_climatico"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    talhao_id = Column(PGUUID(as_uuid=True), ForeignKey("talhoes.id"))
    data = Column(Date, nullable=False)
    chuva_mm = Column(Numeric(6, 2))
    temp_min = Column(Numeric(4, 1))
    temp_max = Column(Numeric(4, 1))
    umidade_relativa = Column(Numeric(5, 2))
