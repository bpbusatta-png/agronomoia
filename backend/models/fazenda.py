import uuid

from sqlalchemy import Column, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from core.database import Base


class Fazenda(Base):
    __tablename__ = "fazendas"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cooperado_id = Column(PGUUID(as_uuid=True), ForeignKey("cooperados.id"))
    nome = Column(String(200), nullable=False)
    municipio = Column(String(120))
    area_ha = Column(Numeric(10, 2))
