import uuid

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from core.database import Base


class DatasetRotulo(Base):
    __tablename__ = "dataset_rotulos"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    fotografia_id = Column(PGUUID(as_uuid=True), ForeignKey("fotografias.id"))
    tipo_rotulo = Column(String(30))
    rotulo_valor = Column(JSONB)
    rotulado_por = Column(PGUUID(as_uuid=True), ForeignKey("usuarios.id"))
    revisado_por = Column(PGUUID(as_uuid=True), ForeignKey("usuarios.id"))
    usado_em_treino = Column(Boolean, default=False)
    criado_em = Column(DateTime, server_default=func.now())
