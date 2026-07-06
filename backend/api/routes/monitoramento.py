import crud
from api.routes.factory import crud_router
from core.roles import admin_ou_rt, campo_ou_rt_ou_admin
from schemas.analise_solo import AnaliseSoloCreate, AnaliseSoloRead, AnaliseSoloUpdate
from schemas.aplicacao import AplicacaoCreate, AplicacaoRead, AplicacaoUpdate
from schemas.fotografia import FotografiaCreate, FotografiaRead, FotografiaUpdate
from schemas.historico_climatico import (
    HistoricoClimaticoCreate,
    HistoricoClimaticoRead,
    HistoricoClimaticoUpdate,
)
from schemas.inspecao import InspecaoCreate, InspecaoRead, InspecaoUpdate

# Inspecoes/fotografias sao trabalho de campo: Tecnico_Campo, Agronomo_RT ou
# Administrador podem escrever, e o usuario_id vem do token (nunca do cliente).
# Historico climatico e mais administrativo (ingestao de dados externos):
# restrito a Administrador/RT. Leitura liberada a qualquer papel autenticado.

routers = [
    crud_router(
        crud=crud.inspecoes,
        read_schema=InspecaoRead,
        create_schema=InspecaoCreate,
        update_schema=InspecaoUpdate,
        prefix="/inspecoes",
        tag="inspecoes",
        write_dep=campo_ou_rt_ou_admin,
        inject_usuario_field="usuario_id",
    ),
    crud_router(
        crud=crud.aplicacoes,
        read_schema=AplicacaoRead,
        create_schema=AplicacaoCreate,
        update_schema=AplicacaoUpdate,
        prefix="/aplicacoes",
        tag="aplicacoes",
        write_dep=campo_ou_rt_ou_admin,
    ),
    crud_router(
        crud=crud.historico_climatico,
        read_schema=HistoricoClimaticoRead,
        create_schema=HistoricoClimaticoCreate,
        update_schema=HistoricoClimaticoUpdate,
        prefix="/historico-climatico",
        tag="historico_climatico",
        write_dep=admin_ou_rt,
    ),
    crud_router(
        crud=crud.analises_solo,
        read_schema=AnaliseSoloRead,
        create_schema=AnaliseSoloCreate,
        update_schema=AnaliseSoloUpdate,
        prefix="/analises-solo",
        tag="analises_solo",
        write_dep=campo_ou_rt_ou_admin,
    ),
    crud_router(
        crud=crud.fotografias,
        read_schema=FotografiaRead,
        create_schema=FotografiaCreate,
        update_schema=FotografiaUpdate,
        prefix="/fotografias",
        tag="fotografias",
        write_dep=campo_ou_rt_ou_admin,
        inject_usuario_field="usuario_id",
    ),
]
