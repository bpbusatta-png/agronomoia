import json
import logging
import sys
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from models import Usuario

logger = logging.getLogger("auditoria")
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter("%(message)s"))
    logger.addHandler(handler)
    logger.propagate = False


def log_operacao(usuario: Usuario, entidade: str, operacao: str, entidade_id: Optional[UUID] = None) -> None:
    logger.info(
        json.dumps(
            {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "usuario_id": str(usuario.id),
                "usuario_email": usuario.email,
                "entidade": entidade,
                "entidade_id": str(entidade_id) if entidade_id else None,
                "operacao": operacao,
            }
        )
    )
