import uuid

from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from core.database import Base


class DoencaCatalogo(Base):
    __tablename__ = "doencas_catalogo"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nome = Column(String(150))
    grupo_frac_recomendado = Column(String(20))
