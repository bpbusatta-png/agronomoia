import uuid

from sqlalchemy import Column, Date, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from core.database import Base


class NdviLeitura(Base):
    __tablename__ = "ndvi_leituras"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    talhao_id = Column(PGUUID(as_uuid=True), ForeignKey("talhoes.id"))
    data = Column(Date)
    fonte = Column(String(20))
    ndvi_medio = Column(Numeric(4, 3))
    ndre_medio = Column(Numeric(4, 3))
    msavi_medio = Column(Numeric(4, 3))
    url_mapa = Column(Text)
