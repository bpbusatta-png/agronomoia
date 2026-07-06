import uuid

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from core.database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nome = Column(String(200), nullable=False)
    email = Column(String(200), unique=True, nullable=False)
    senha_hash = Column(Text, nullable=False)
    papel_id = Column(PGUUID(as_uuid=True), ForeignKey("papeis.id"))
    ativo = Column(Boolean, default=True)
    criado_em = Column(DateTime, server_default=func.now())
