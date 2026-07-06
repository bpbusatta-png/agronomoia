import uuid

from sqlalchemy import Column, Date, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from core.database import Base


class ConsentimentoLgpd(Base):
    __tablename__ = "consentimentos_lgpd"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cooperado_id = Column(PGUUID(as_uuid=True), ForeignKey("cooperados.id"))
    finalidade = Column(String(150))
    base_legal = Column(String(60))
    data_consentimento = Column(Date)
    data_expiracao = Column(Date)
