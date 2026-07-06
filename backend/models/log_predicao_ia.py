import uuid

from sqlalchemy import Column, DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from core.database import Base


class LogPredicaoIA(Base):
    __tablename__ = "log_predicoes_ia"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    modelo_versao_id = Column(PGUUID(as_uuid=True), ForeignKey("modelos_versoes.id"))
    entidade_referenciada = Column(String(60))
    entidade_id = Column(PGUUID(as_uuid=True))
    entrada_resumo = Column(JSONB)
    saida_predita = Column(JSONB)
    confianca = Column(Numeric(4, 3))
    criado_em = Column(DateTime, server_default=func.now())
