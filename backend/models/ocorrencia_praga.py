import uuid

from sqlalchemy import Column, Date, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from core.database import Base


class OcorrenciaPraga(Base):
    __tablename__ = "ocorrencias_pragas"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    fotografia_id = Column(PGUUID(as_uuid=True), ForeignKey("fotografias.id"))
    talhao_id = Column(PGUUID(as_uuid=True), ForeignKey("talhoes.id"))
    praga_id = Column(PGUUID(as_uuid=True), ForeignKey("pragas_catalogo.id"))
    estadio = Column(String(30))
    populacao_estimada = Column(Numeric(8, 2))
    nivel_dano = Column(String(20))
    nivel_controle = Column(String(20))
    modelo_versao_id = Column(PGUUID(as_uuid=True), ForeignKey("modelos_versoes.id"))
    confianca_modelo = Column(Numeric(4, 3))
    validado_por = Column(PGUUID(as_uuid=True), ForeignKey("usuarios.id"))
    data = Column(Date)
