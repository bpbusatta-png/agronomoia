import uuid

from sqlalchemy import Boolean, Column, Date, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from core.database import Base


class ModeloVersao(Base):
    __tablename__ = "modelos_versoes"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tipo_modelo = Column(String(30))
    versao = Column(String(20))
    data_treino = Column(Date)
    metricas_validacao = Column(JSONB)
    em_producao = Column(Boolean, default=False)
