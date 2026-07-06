import uuid

from sqlalchemy import Boolean, Column, Date, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from core.database import Base


class PlantaAtipicaOcorrencia(Base):
    __tablename__ = "plantas_atipicas_ocorrencias"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    fotografia_id = Column(PGUUID(as_uuid=True), ForeignKey("fotografias.id"))
    talhao_id = Column(PGUUID(as_uuid=True), ForeignKey("talhoes.id"))
    caracteristica_avaliada = Column(String(50))
    conforme_padrao = Column(Boolean)
    justificativa_tecnica = Column(Text)
    recomendacao = Column(String(30))
    modelo_versao_id = Column(PGUUID(as_uuid=True), ForeignKey("modelos_versoes.id"))
    confianca_modelo = Column(Numeric(4, 3))
    validado_por = Column(PGUUID(as_uuid=True), ForeignKey("usuarios.id"))
    status = Column(String(20), default="pendente_validacao")
    data = Column(Date)
