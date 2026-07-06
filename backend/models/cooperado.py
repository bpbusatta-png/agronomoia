import uuid

from geoalchemy2 import Geometry
from sqlalchemy import CHAR, Column, DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from core.database import Base


class Cooperado(Base):
    __tablename__ = "cooperados"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    codigo = Column(String(30), unique=True, nullable=False)
    nome = Column(String(200), nullable=False)
    contato_telefone = Column(String(30))
    contato_email = Column(String(200))
    municipio = Column(String(120))
    estado = Column(CHAR(2))
    localizacao = Column(Geometry(geometry_type="POINT", srid=4326))
    criado_em = Column(DateTime, server_default=func.now())
