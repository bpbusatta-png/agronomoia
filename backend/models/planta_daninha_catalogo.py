import uuid

from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from core.database import Base


class PlantaDaninhaCatalogo(Base):
    __tablename__ = "plantas_daninhas_catalogo"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nome_comum = Column(String(150))
    nome_cientifico = Column(String(150))
    ciclo = Column(String(20))
