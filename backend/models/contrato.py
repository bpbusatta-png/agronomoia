import uuid

from sqlalchemy import Column, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from core.database import Base


class Contrato(Base):
    __tablename__ = "contratos"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    empresa_id = Column(PGUUID(as_uuid=True), ForeignKey("empresas.id"))
    cultivar_id = Column(PGUUID(as_uuid=True), ForeignKey("cultivares.id"))
    cooperado_id = Column(PGUUID(as_uuid=True), ForeignKey("cooperados.id"))
    safra_id = Column(PGUUID(as_uuid=True), ForeignKey("safras.id"))
    area_contratada_ha = Column(Numeric(10, 2))
    area_plantada_ha = Column(Numeric(10, 2), default=0)
    producao_prevista_kg = Column(Numeric(12, 2))
    status = Column(String(30), default="aberto")
