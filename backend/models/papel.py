import uuid

from sqlalchemy import Column, String, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from core.database import Base


class Papel(Base):
    __tablename__ = "papeis"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nome = Column(String(50), nullable=False)
    descricao = Column(Text)
