import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from core.database import Base


class SincronizacaoLog(Base):
    __tablename__ = "sincronizacao_log"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dispositivo_id = Column(String(100))
    usuario_id = Column(PGUUID(as_uuid=True), ForeignKey("usuarios.id"))
    entidade_referenciada = Column(String(60))
    entidade_id = Column(PGUUID(as_uuid=True))
    operacao = Column(String(20))
    timestamp_local = Column(DateTime)
    timestamp_servidor = Column(DateTime, server_default=func.now())
    status_conflito = Column(String(20), default="ok")
