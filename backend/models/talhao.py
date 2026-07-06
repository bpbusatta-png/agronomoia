import uuid

from geoalchemy2 import Geometry
from sqlalchemy import Column, Date, DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from core.database import Base


class Talhao(Base):
    __tablename__ = "talhoes"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    fazenda_id = Column(PGUUID(as_uuid=True), ForeignKey("fazendas.id"))
    codigo = Column(String(30), nullable=False)
    area_ha = Column(Numeric(10, 2))
    contorno = Column(Geometry(geometry_type="POLYGON", srid=4326))
    empresa_id = Column(PGUUID(as_uuid=True), ForeignKey("empresas.id"))
    cultivar_id = Column(PGUUID(as_uuid=True), ForeignKey("cultivares.id"))
    safra_id = Column(PGUUID(as_uuid=True), ForeignKey("safras.id"))
    classe_semente = Column(String(40))
    data_plantio = Column(Date)
    criado_em = Column(DateTime, server_default=func.now())
