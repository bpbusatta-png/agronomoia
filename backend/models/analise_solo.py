import uuid

from sqlalchemy import Column, Date, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from core.database import Base


class AnaliseSolo(Base):
    __tablename__ = "analises_solo"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    talhao_id = Column(PGUUID(as_uuid=True), ForeignKey("talhoes.id"))
    data = Column(Date)
    ph = Column(Numeric(3, 1))
    materia_organica = Column(Numeric(5, 2))
    nutrientes = Column(JSONB)
