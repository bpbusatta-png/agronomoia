import uuid

from sqlalchemy import Column, Date, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from core.database import Base


class Inspecao(Base):
    __tablename__ = "inspecoes"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    talhao_id = Column(PGUUID(as_uuid=True), ForeignKey("talhoes.id"))
    usuario_id = Column(PGUUID(as_uuid=True), ForeignKey("usuarios.id"))
    data = Column(Date, nullable=False)
    estadio_fenologico = Column(String(20))
    observacoes = Column(Text)
