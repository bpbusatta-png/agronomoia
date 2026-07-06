import uuid

from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from core.database import Base


class Cultivar(Base):
    __tablename__ = "cultivares"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nome = Column(String(120), nullable=False)
    empresa_id = Column(PGUUID(as_uuid=True), ForeignKey("empresas.id"))
    especie = Column(String(60))
    ciclo_dias = Column(Integer)
