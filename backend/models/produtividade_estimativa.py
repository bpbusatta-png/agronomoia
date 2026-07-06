import uuid

from sqlalchemy import Column, Date, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from core.database import Base


class ProdutividadeEstimativa(Base):
    __tablename__ = "produtividade_estimativas"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    talhao_id = Column(PGUUID(as_uuid=True), ForeignKey("talhoes.id"))
    safra_id = Column(PGUUID(as_uuid=True), ForeignKey("safras.id"))
    populacao_plantas_ha = Column(Numeric(10, 2))
    vagens_por_planta = Column(Numeric(6, 2))
    graos_por_vagem = Column(Numeric(5, 2))
    pmg = Column(Numeric(6, 2))
    produtividade_estimada_kg_ha = Column(Numeric(10, 2))
    intervalo_confianca_min = Column(Numeric(10, 2))
    intervalo_confianca_max = Column(Numeric(10, 2))
    data = Column(Date)
