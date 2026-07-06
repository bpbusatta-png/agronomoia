import crud
from api.routes.factory import crud_router
from core.deps import get_current_user
from core.roles import admin_ou_rt, admin_only, campo_ou_rt_ou_admin
from schemas.consentimento_lgpd import (
    ConsentimentoLgpdCreate,
    ConsentimentoLgpdRead,
    ConsentimentoLgpdUpdate,
)
from schemas.dataset_rotulo import DatasetRotuloCreate, DatasetRotuloRead, DatasetRotuloUpdate
from schemas.log_predicao_ia import LogPredicaoIACreate, LogPredicaoIARead
from schemas.sincronizacao_log import (
    SincronizacaoLogCreate,
    SincronizacaoLogRead,
    SincronizacaoLogUpdate,
)

routers = [
    # B0 - pipeline de rotulagem: tecnico/RT/admin rotulam; so admin/RT revisam
    # (revisado_por so vem via update, e update_dep ja restringe a admin_ou_rt).
    crud_router(
        crud=crud.dataset_rotulos,
        read_schema=DatasetRotuloRead,
        create_schema=DatasetRotuloCreate,
        update_schema=DatasetRotuloUpdate,
        prefix="/dataset-rotulos",
        tag="dataset_rotulos",
        create_dep=campo_ou_rt_ou_admin,
        update_dep=admin_ou_rt,
        delete_dep=admin_ou_rt,
        inject_usuario_field="rotulado_por",
    ),
    # Trilha C - log de predicoes de IA: imutavel (sem PUT/DELETE), escrito
    # por quem opera os modelos (admin/RT ate existir um papel de servico),
    # leitura restrita por ser dado de auditoria/drift.
    crud_router(
        crud=crud.log_predicoes_ia,
        read_schema=LogPredicaoIARead,
        create_schema=LogPredicaoIACreate,
        prefix="/log-predicoes-ia",
        tag="log_predicoes_ia",
        read_dep=admin_ou_rt,
        write_dep=admin_ou_rt,
        enable_update=False,
        enable_delete=False,
    ),
    # Trilha C - consentimentos LGPD: dado pessoal sensivel de cooperados,
    # gestao exclusiva do Administrador.
    crud_router(
        crud=crud.consentimentos_lgpd,
        read_schema=ConsentimentoLgpdRead,
        create_schema=ConsentimentoLgpdCreate,
        update_schema=ConsentimentoLgpdUpdate,
        prefix="/consentimentos-lgpd",
        tag="consentimentos_lgpd",
        read_dep=admin_only,
        write_dep=admin_only,
    ),
    # Trilha D - log de sincronizacao mobile: qualquer usuario autenticado
    # registra sua propria sincronizacao (usuario_id vem do token); nunca
    # se exclui historico de sync; so admin/RT ajustam status_conflito.
    crud_router(
        crud=crud.sincronizacao_log,
        read_schema=SincronizacaoLogRead,
        create_schema=SincronizacaoLogCreate,
        update_schema=SincronizacaoLogUpdate,
        prefix="/sincronizacao-log",
        tag="sincronizacao_log",
        read_dep=admin_ou_rt,
        create_dep=get_current_user,
        update_dep=admin_ou_rt,
        enable_delete=False,
        inject_usuario_field="usuario_id",
    ),
]
