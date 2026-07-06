import uuid

from sqlalchemy import Column, Date, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from core.database import Base


class Aplicacao(Base):
    __tablename__ = "aplicacoes"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    talhao_id = Column(PGUUID(as_uuid=True), ForeignKey("talhoes.id"))
    produto = Column(String(150))
    ingrediente_ativo = Column(String(150))
    dose = Column(Numeric(8, 3))
    data = Column(Date)
    volume_calda_l_ha = Column(Numeric(8, 2))
    tecnologia_aplicacao = Column(String(100))
