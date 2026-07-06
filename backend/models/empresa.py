import uuid

from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from core.database import Base


class Empresa(Base):
    __tablename__ = "empresas"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nome = Column(String(200), nullable=False)
    cnpj = Column(String(20), unique=True)
    contato = Column(String(200))
