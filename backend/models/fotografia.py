import uuid

from geoalchemy2 import Geometry
from sqlalchemy import Column, DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from core.database import Base


class Fotografia(Base):
    __tablename__ = "fotografias"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    talhao_id = Column(PGUUID(as_uuid=True), ForeignKey("talhoes.id"))
    inspecao_id = Column(PGUUID(as_uuid=True), ForeignKey("inspecoes.id"))
    usuario_id = Column(PGUUID(as_uuid=True), ForeignKey("usuarios.id"))
    url_arquivo = Column(Text, nullable=False)
    localizacao = Column(Geometry(geometry_type="POINT", srid=4326))
    tipo = Column(String(30))
    capturado_em = Column(DateTime, server_default=func.now())
