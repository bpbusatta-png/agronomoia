from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import crud
from api.routes.factory import crud_router
from core.database import get_db
from core.logging import log_operacao
from core.roles import admin_ou_rt, campo_ou_rt_ou_admin
from models import ValidacaoHumana
from schemas.colheita import ColheitaCreate, ColheitaRead, ColheitaUpdate
from schemas.dataset_rotulo import DatasetRotuloCreate
from schemas.doenca_catalogo import DoencaCatalogoCreate, DoencaCatalogoRead, DoencaCatalogoUpdate
from schemas.modelo_versao import ModeloVersaoCreate, ModeloVersaoRead, ModeloVersaoUpdate
from schemas.ndvi_leitura import NdviLeituraCreate, NdviLeituraRead, NdviLeituraUpdate
from schemas.ocorrencia_doenca import OcorrenciaDoencaCreate, OcorrenciaDoencaRead, OcorrenciaDoencaUpdate
from schemas.ocorrencia_planta_daninha import (
    OcorrenciaPlantaDaninhaCreate,
    OcorrenciaPlantaDaninhaRead,
    OcorrenciaPlantaDaninhaUpdate,
)
from schemas.ocorrencia_praga import OcorrenciaPragaCreate, OcorrenciaPragaRead, OcorrenciaPragaUpdate
from schemas.planta_atipica_ocorrencia import (
    PlantaAtipicaOcorrenciaCreate,
    PlantaAtipicaOcorrenciaRead,
    PlantaAtipicaOcorrenciaUpdate,
    ValidarPlantaAtipicaRequest,
)
from schemas.planta_daninha_catalogo import (
    PlantaDaninhaCatalogoCreate,
    PlantaDaninhaCatalogoRead,
    PlantaDaninhaCatalogoUpdate,
)
from schemas.praga_catalogo import PragaCatalogoCreate, PragaCatalogoRead, PragaCatalogoUpdate
from schemas.produtividade_estimativa import (
    ProdutividadeEstimativaCreate,
    ProdutividadeEstimativaRead,
    ProdutividadeEstimativaUpdate,
)
from schemas.validacao_humana import ValidacaoHumanaRead

# --- Acumulo de dataset rotulado (abordagem hibrida acordada com o usuario):
# toda vez que uma ocorrencia nasce de uma sugestao da IA de visao (tem
# modelo_versao_id) e tem foto associada, o valor CONFIRMADO PELO HUMANO ao
# criar o registro vira um rotulo real em dataset_rotulos -- acumulando aos
# poucos um dataset de verdade para um futuro modelo treinado, sem exigir
# nenhum passo manual extra do tecnico. Ver docs/02-trilha-b-inteligencia/
# pipeline-dados-rotulagem.md e core/ai_vision.py.


def _acumular_dataset_rotulo(db, tipo_rotulo: str, obj, current_user, rotulo_valor: dict) -> None:
    if not obj.modelo_versao_id or not obj.fotografia_id:
        return
    crud.dataset_rotulos.create(
        db,
        DatasetRotuloCreate(fotografia_id=obj.fotografia_id, tipo_rotulo=tipo_rotulo, rotulo_valor=rotulo_valor),
        rotulado_por=current_user.id,
    )


def _on_create_ocorrencia_praga(db, obj, current_user) -> None:
    _acumular_dataset_rotulo(
        db, "pragas", obj, current_user, {"praga_id": str(obj.praga_id) if obj.praga_id else None}
    )


def _on_create_ocorrencia_doenca(db, obj, current_user) -> None:
    _acumular_dataset_rotulo(
        db, "doencas", obj, current_user, {"doenca_id": str(obj.doenca_id) if obj.doenca_id else None}
    )


def _on_create_ocorrencia_planta_daninha(db, obj, current_user) -> None:
    _acumular_dataset_rotulo(
        db,
        "plantas_daninhas",
        obj,
        current_user,
        {"planta_daninha_id": str(obj.planta_daninha_id) if obj.planta_daninha_id else None},
    )


def _on_create_planta_atipica(db, obj, current_user) -> None:
    _acumular_dataset_rotulo(
        db,
        "plantas_atipicas",
        obj,
        current_user,
        {"caracteristica_avaliada": obj.caracteristica_avaliada, "conforme_padrao": obj.conforme_padrao},
    )

routers = [
    crud_router(
        crud=crud.modelos_versoes,
        read_schema=ModeloVersaoRead,
        create_schema=ModeloVersaoCreate,
        update_schema=ModeloVersaoUpdate,
        prefix="/modelos-versoes",
        tag="modelos_versoes",
        write_dep=admin_ou_rt,
    ),
    crud_router(
        crud=crud.pragas_catalogo,
        read_schema=PragaCatalogoRead,
        create_schema=PragaCatalogoCreate,
        update_schema=PragaCatalogoUpdate,
        prefix="/pragas-catalogo",
        tag="pragas_catalogo",
        write_dep=admin_ou_rt,
    ),
    crud_router(
        crud=crud.doencas_catalogo,
        read_schema=DoencaCatalogoRead,
        create_schema=DoencaCatalogoCreate,
        update_schema=DoencaCatalogoUpdate,
        prefix="/doencas-catalogo",
        tag="doencas_catalogo",
        write_dep=admin_ou_rt,
    ),
    crud_router(
        crud=crud.ocorrencias_pragas,
        read_schema=OcorrenciaPragaRead,
        create_schema=OcorrenciaPragaCreate,
        update_schema=OcorrenciaPragaUpdate,
        prefix="/ocorrencias-pragas",
        tag="ocorrencias_pragas",
        create_dep=campo_ou_rt_ou_admin,
        update_dep=admin_ou_rt,
        delete_dep=admin_ou_rt,
        on_create=_on_create_ocorrencia_praga,
    ),
    crud_router(
        crud=crud.ocorrencias_doencas,
        read_schema=OcorrenciaDoencaRead,
        create_schema=OcorrenciaDoencaCreate,
        update_schema=OcorrenciaDoencaUpdate,
        prefix="/ocorrencias-doencas",
        tag="ocorrencias_doencas",
        create_dep=campo_ou_rt_ou_admin,
        update_dep=admin_ou_rt,
        delete_dep=admin_ou_rt,
        on_create=_on_create_ocorrencia_doenca,
    ),
    crud_router(
        crud=crud.plantas_daninhas_catalogo,
        read_schema=PlantaDaninhaCatalogoRead,
        create_schema=PlantaDaninhaCatalogoCreate,
        update_schema=PlantaDaninhaCatalogoUpdate,
        prefix="/plantas-daninhas-catalogo",
        tag="plantas_daninhas_catalogo",
        write_dep=admin_ou_rt,
    ),
    crud_router(
        crud=crud.ocorrencias_plantas_daninhas,
        read_schema=OcorrenciaPlantaDaninhaRead,
        create_schema=OcorrenciaPlantaDaninhaCreate,
        update_schema=OcorrenciaPlantaDaninhaUpdate,
        prefix="/ocorrencias-plantas-daninhas",
        tag="ocorrencias_plantas_daninhas",
        create_dep=campo_ou_rt_ou_admin,
        update_dep=admin_ou_rt,
        delete_dep=admin_ou_rt,
        on_create=_on_create_ocorrencia_planta_daninha,
    ),
    crud_router(
        crud=crud.plantas_atipicas_ocorrencias,
        read_schema=PlantaAtipicaOcorrenciaRead,
        create_schema=PlantaAtipicaOcorrenciaCreate,
        update_schema=PlantaAtipicaOcorrenciaUpdate,
        prefix="/plantas-atipicas",
        tag="plantas_atipicas",
        create_dep=campo_ou_rt_ou_admin,
        update_dep=admin_ou_rt,
        delete_dep=admin_ou_rt,
        on_create=_on_create_planta_atipica,
    ),
    crud_router(
        crud=crud.ndvi_leituras,
        read_schema=NdviLeituraRead,
        create_schema=NdviLeituraCreate,
        update_schema=NdviLeituraUpdate,
        prefix="/ndvi-leituras",
        tag="ndvi_leituras",
        write_dep=admin_ou_rt,
    ),
    crud_router(
        crud=crud.produtividade_estimativas,
        read_schema=ProdutividadeEstimativaRead,
        create_schema=ProdutividadeEstimativaCreate,
        update_schema=ProdutividadeEstimativaUpdate,
        prefix="/produtividade-estimativas",
        tag="produtividade_estimativas",
        write_dep=admin_ou_rt,
    ),
    crud_router(
        crud=crud.colheita,
        read_schema=ColheitaRead,
        create_schema=ColheitaCreate,
        update_schema=ColheitaUpdate,
        prefix="/colheita",
        tag="colheita",
        write_dep=campo_ou_rt_ou_admin,
    ),
]

# --- Validacao de plantas atipicas (gate humano obrigatorio, Trilha C) ---

validacao_router = APIRouter(prefix="/plantas-atipicas", tags=["plantas_atipicas"])


@validacao_router.post("/{id}/validar", response_model=PlantaAtipicaOcorrenciaRead)
def validar_planta_atipica(
    id: UUID,
    payload: ValidarPlantaAtipicaRequest,
    db: Session = Depends(get_db),
    current_user=Depends(admin_ou_rt),
):
    ocorrencia = crud.plantas_atipicas_ocorrencias.get(db, id)
    if not ocorrencia:
        raise HTTPException(status_code=404, detail="plantas_atipicas não encontrado")

    ocorrencia.recomendacao = payload.decisao
    ocorrencia.validado_por = current_user.id
    ocorrencia.status = "validado"
    db.add(ocorrencia)

    db.add(
        ValidacaoHumana(
            entidade_referenciada="plantas_atipicas_ocorrencias",
            entidade_id=id,
            usuario_validador_id=current_user.id,
            decisao=payload.decisao,
            justificativa=payload.justificativa,
        )
    )
    db.commit()
    db.refresh(ocorrencia)

    log_operacao(current_user, "plantas_atipicas", "validar", id)
    return ocorrencia


routers.append(validacao_router)

# --- Auditoria (Trilha C): somente leitura, restrita a Administrador/RT ---

validacoes_humanas_router = APIRouter(prefix="/validacoes-humanas", tags=["validacoes_humanas"])


@validacoes_humanas_router.get("", response_model=list[ValidacaoHumanaRead])
def listar_validacoes(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _user=Depends(admin_ou_rt),
):
    return crud.validacoes_humanas.list(db, skip=skip, limit=limit)


@validacoes_humanas_router.get("/{id}", response_model=ValidacaoHumanaRead)
def obter_validacao(id: UUID, db: Session = Depends(get_db), _user=Depends(admin_ou_rt)):
    obj = crud.validacoes_humanas.get(db, id)
    if not obj:
        raise HTTPException(status_code=404, detail="validacoes_humanas não encontrado")
    return obj


routers.append(validacoes_humanas_router)
