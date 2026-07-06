import uuid

from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from core.database import Base


class PragaCatalogo(Base):
    __tablename__ = "pragas_catalogo"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nome_comum = Column(String(150))
    nome_cientifico = Column(String(150))
    grupo_irac_recomendado = Column(String(20))
