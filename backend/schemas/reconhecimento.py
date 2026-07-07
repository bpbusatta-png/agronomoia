from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class ReconhecimentoResponse(BaseModel):
    tipo_identificado: str  # praga, doenca, planta_daninha, planta_atipica, indeterminado
    nome_sugerido: Optional[str] = None
    confianca: float
    observacoes: str
    modelo_versao_id: UUID
