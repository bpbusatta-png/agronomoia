import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from core.database import Base


class ValidacaoHumana(Base):
    __tablename__ = "validacoes_humanas"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entidade_referenciada = Column(String(60))
    entidade_id = Column(PGUUID(as_uuid=True))
    usuario_validador_id = Column(PGUUID(as_uuid=True), ForeignKey("usuarios.id"))
    decisao = Column(String(30))
    justificativa = Column(Text)
    criado_em = Column(DateTime, server_default=func.now())
