import uuid

from sqlalchemy import Column, Date, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from core.database import Base


class OcorrenciaPlantaDaninha(Base):
    __tablename__ = "ocorrencias_plantas_daninhas"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    fotografia_id = Column(PGUUID(as_uuid=True), ForeignKey("fotografias.id"))
    talhao_id = Column(PGUUID(as_uuid=True), ForeignKey("talhoes.id"))
    planta_daninha_id = Column(PGUUID(as_uuid=True), ForeignKey("plantas_daninhas_catalogo.id"))
    nivel_infestacao = Column(String(20))
    estadio_cultura = Column(String(30))
    modelo_versao_id = Column(PGUUID(as_uuid=True), ForeignKey("modelos_versoes.id"))
    confianca_modelo = Column(Numeric(4, 3))
    validado_por = Column(PGUUID(as_uuid=True), ForeignKey("usuarios.id"))
    data = Column(Date)
