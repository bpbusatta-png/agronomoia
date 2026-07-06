import uuid

from sqlalchemy import Column, Date, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from core.database import Base


class Colheita(Base):
    __tablename__ = "colheita"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    talhao_id = Column(PGUUID(as_uuid=True), ForeignKey("talhoes.id"))
    safra_id = Column(PGUUID(as_uuid=True), ForeignKey("safras.id"))
    data = Column(Date)
    quantidade_kg = Column(Numeric(12, 2))
    umidade_colheita = Column(Numeric(5, 2))
    qualidade_semente = Column(String(30))
