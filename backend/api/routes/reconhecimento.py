import logging
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

import crud
from api.routes.uploads import ALLOWED_CONTENT_TYPES, MAX_SIZE_BYTES
from core.ai_vision import AIVisionNotConfigured, classificar_imagem
from core.database import get_db
from core.logging import log_operacao
from core.roles import campo_ou_rt_ou_admin
from models import ModeloVersao
from schemas.log_predicao_ia import LogPredicaoIACreate
from schemas.reconhecimento import ReconhecimentoResponse

logger = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/reconhecimento", tags=["reconhecimento"])

# Nome de versao fixo para a integracao via API de visao (nao e um modelo
# proprio treinado -- ver core/ai_vision.py e docs/02-trilha-b-inteligencia/
# pipeline-dados-rotulagem.md para o plano de migrar para modelo customizado
# uma vez que dataset_rotulos acumule volume suficiente).
_VERSAO_MODELO_API = "reco-visual-api-v1"  # cabe em modelos_versoes.versao VARCHAR(20)


def _get_or_create_modelo_versao(db: Session) -> ModeloVersao:
    modelo = (
        db.query(ModeloVersao)
        .filter(ModeloVersao.tipo_modelo == "reconhecimento_visual", ModeloVersao.versao == _VERSAO_MODELO_API)
        .first()
    )
    if modelo:
        return modelo
    modelo = ModeloVersao(tipo_modelo="reconhecimento_visual", versao=_VERSAO_MODELO_API, em_producao=True)
    db.add(modelo)
    db.commit()
    db.refresh(modelo)
    return modelo


@router.post("/classificar", response_model=ReconhecimentoResponse, status_code=201)
async def classificar(
    file: UploadFile,
    tipo_esperado: Optional[str] = Form(None),
    fotografia_id: Optional[UUID] = Form(None),
    db: Session = Depends(get_db),
    current_user=Depends(campo_ou_rt_ou_admin),
):
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=415, detail=f"Tipo de arquivo não suportado: {file.content_type}")

    contents = await file.read()
    if len(contents) > MAX_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="Arquivo maior que 15 MB")

    try:
        resultado = classificar_imagem(contents, file.content_type, tipo_esperado)
    except AIVisionNotConfigured:
        raise HTTPException(
            status_code=503,
            detail="Reconhecimento por IA não configurado (defina ANTHROPIC_API_KEY no backend).",
        )
    except Exception:
        logger.exception("Falha ao consultar a IA de reconhecimento (POST /reconhecimento/classificar)")
        raise HTTPException(status_code=502, detail="Erro ao consultar o serviço de IA. Tente novamente.")

    modelo = _get_or_create_modelo_versao(db)

    crud.log_predicoes_ia.create(
        db,
        LogPredicaoIACreate(
            modelo_versao_id=modelo.id,
            entidade_referenciada="fotografias" if fotografia_id else "reconhecimento",
            entidade_id=fotografia_id,
            entrada_resumo={"tipo_esperado": tipo_esperado, "filename": file.filename},
            saida_predita={
                "tipo_identificado": resultado["tipo_identificado"],
                "nome_sugerido": resultado["nome_sugerido"],
                "observacoes": resultado["observacoes"],
            },
            confianca=resultado["confianca"],
        ),
    )
    log_operacao(current_user, "reconhecimento", "classificar")

    return ReconhecimentoResponse(
        tipo_identificado=resultado["tipo_identificado"],
        nome_sugerido=resultado["nome_sugerido"],
        confianca=resultado["confianca"],
        observacoes=resultado["observacoes"],
        modelo_versao_id=modelo.id,
    )
