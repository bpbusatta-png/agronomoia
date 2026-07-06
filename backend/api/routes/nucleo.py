import crud
from api.routes.factory import crud_router
from schemas.contrato import ContratoCreate, ContratoRead, ContratoUpdate
from schemas.cooperado import CooperadoCreate, CooperadoRead, CooperadoUpdate
from schemas.cultivar import CultivarCreate, CultivarRead, CultivarUpdate
from schemas.empresa import EmpresaCreate, EmpresaRead, EmpresaUpdate
from schemas.fazenda import FazendaCreate, FazendaRead, FazendaUpdate
from schemas.papel import PapelCreate, PapelRead, PapelUpdate
from schemas.safra import SafraCreate, SafraRead, SafraUpdate
from schemas.talhao import TalhaoCreate, TalhaoRead, TalhaoUpdate
from schemas.usuario import UsuarioCreate, UsuarioRead, UsuarioUpdate

routers = [
    crud_router(
        crud=crud.papeis,
        read_schema=PapelRead,
        create_schema=PapelCreate,
        update_schema=PapelUpdate,
        prefix="/papeis",
        tag="papeis",
    ),
    crud_router(
        crud=crud.usuarios,
        read_schema=UsuarioRead,
        create_schema=UsuarioCreate,
        update_schema=UsuarioUpdate,
        prefix="/usuarios",
        tag="usuarios",
    ),
    crud_router(
        crud=crud.cooperados,
        read_schema=CooperadoRead,
        create_schema=CooperadoCreate,
        update_schema=CooperadoUpdate,
        prefix="/cooperados",
        tag="cooperados",
    ),
    crud_router(
        crud=crud.empresas,
        read_schema=EmpresaRead,
        create_schema=EmpresaCreate,
        update_schema=EmpresaUpdate,
        prefix="/empresas",
        tag="empresas",
    ),
    crud_router(
        crud=crud.fazendas,
        read_schema=FazendaRead,
        create_schema=FazendaCreate,
        update_schema=FazendaUpdate,
        prefix="/fazendas",
        tag="fazendas",
    ),
    crud_router(
        crud=crud.safras,
        read_schema=SafraRead,
        create_schema=SafraCreate,
        update_schema=SafraUpdate,
        prefix="/safras",
        tag="safras",
    ),
    crud_router(
        crud=crud.cultivares,
        read_schema=CultivarRead,
        create_schema=CultivarCreate,
        update_schema=CultivarUpdate,
        prefix="/cultivares",
        tag="cultivares",
    ),
    crud_router(
        crud=crud.talhoes,
        read_schema=TalhaoRead,
        create_schema=TalhaoCreate,
        update_schema=TalhaoUpdate,
        prefix="/talhoes",
        tag="talhoes",
    ),
    crud_router(
        crud=crud.contratos,
        read_schema=ContratoRead,
        create_schema=ContratoCreate,
        update_schema=ContratoUpdate,
        prefix="/contratos",
        tag="contratos",
    ),
]
