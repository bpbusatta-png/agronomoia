from typing import Generic, List, Optional, Type, TypeVar
from uuid import UUID

from pydantic import BaseModel
from sqlalchemy.orm import Session

from core.security import hash_password
from models import (
    AnaliseSolo,
    Aplicacao,
    Colheita,
    ConsentimentoLgpd,
    Contrato,
    Cooperado,
    Cultivar,
    DatasetRotulo,
    DoencaCatalogo,
    Empresa,
    Fazenda,
    Fotografia,
    HistoricoClimatico,
    Inspecao,
    LogPredicaoIA,
    ModeloVersao,
    NdviLeitura,
    OcorrenciaDoenca,
    OcorrenciaPlantaDaninha,
    OcorrenciaPraga,
    Papel,
    PlantaAtipicaOcorrencia,
    PlantaDaninhaCatalogo,
    PragaCatalogo,
    ProdutividadeEstimativa,
    Safra,
    SincronizacaoLog,
    Talhao,
    Usuario,
    ValidacaoHumana,
)
from schemas.analise_solo import AnaliseSoloCreate, AnaliseSoloUpdate
from schemas.aplicacao import AplicacaoCreate, AplicacaoUpdate
from schemas.colheita import ColheitaCreate, ColheitaUpdate
from schemas.consentimento_lgpd import ConsentimentoLgpdCreate, ConsentimentoLgpdUpdate
from schemas.contrato import ContratoCreate, ContratoUpdate
from schemas.cooperado import CooperadoCreate, CooperadoUpdate
from schemas.cultivar import CultivarCreate, CultivarUpdate
from schemas.dataset_rotulo import DatasetRotuloCreate, DatasetRotuloUpdate
from schemas.doenca_catalogo import DoencaCatalogoCreate, DoencaCatalogoUpdate
from schemas.empresa import EmpresaCreate, EmpresaUpdate
from schemas.fazenda import FazendaCreate, FazendaUpdate
from schemas.fotografia import FotografiaCreate, FotografiaUpdate
from schemas.historico_climatico import HistoricoClimaticoCreate, HistoricoClimaticoUpdate
from schemas.inspecao import InspecaoCreate, InspecaoUpdate
from schemas.log_predicao_ia import LogPredicaoIACreate
from schemas.modelo_versao import ModeloVersaoCreate, ModeloVersaoUpdate
from schemas.ndvi_leitura import NdviLeituraCreate, NdviLeituraUpdate
from schemas.ocorrencia_doenca import OcorrenciaDoencaCreate, OcorrenciaDoencaUpdate
from schemas.ocorrencia_planta_daninha import (
    OcorrenciaPlantaDaninhaCreate,
    OcorrenciaPlantaDaninhaUpdate,
)
from schemas.ocorrencia_praga import OcorrenciaPragaCreate, OcorrenciaPragaUpdate
from schemas.papel import PapelCreate, PapelUpdate
from schemas.planta_atipica_ocorrencia import (
    PlantaAtipicaOcorrenciaCreate,
    PlantaAtipicaOcorrenciaUpdate,
)
from schemas.planta_daninha_catalogo import (
    PlantaDaninhaCatalogoCreate,
    PlantaDaninhaCatalogoUpdate,
)
from schemas.praga_catalogo import PragaCatalogoCreate, PragaCatalogoUpdate
from schemas.produtividade_estimativa import (
    ProdutividadeEstimativaCreate,
    ProdutividadeEstimativaUpdate,
)
from schemas.safra import SafraCreate, SafraUpdate
from schemas.sincronizacao_log import SincronizacaoLogCreate, SincronizacaoLogUpdate
from schemas.talhao import TalhaoCreate, TalhaoUpdate
from schemas.usuario import UsuarioCreate, UsuarioUpdate

ModelType = TypeVar("ModelType")
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class CRUDBase(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    def __init__(self, model: Type[ModelType]):
        self.model = model

    def get(self, db: Session, id: UUID) -> Optional[ModelType]:
        return db.get(self.model, id)

    def list(self, db: Session, skip: int = 0, limit: int = 100) -> List[ModelType]:
        return db.query(self.model).offset(skip).limit(limit).all()

    def create(self, db: Session, obj_in: CreateSchemaType, **extra_fields) -> ModelType:
        data = obj_in.model_dump()
        data.update(extra_fields)
        obj = self.model(**data)
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return obj

    def update(self, db: Session, db_obj: ModelType, obj_in: UpdateSchemaType) -> ModelType:
        for field, value in obj_in.model_dump(exclude_unset=True).items():
            setattr(db_obj, field, value)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def remove(self, db: Session, id: UUID) -> Optional[ModelType]:
        obj = db.get(self.model, id)
        if obj:
            db.delete(obj)
            db.commit()
        return obj


class CRUDUsuario(CRUDBase[Usuario, UsuarioCreate, UsuarioUpdate]):
    def create(self, db: Session, obj_in: UsuarioCreate) -> Usuario:
        data = obj_in.model_dump(exclude={"senha"})
        data["senha_hash"] = hash_password(obj_in.senha)
        obj = self.model(**data)
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return obj

    def update(self, db: Session, db_obj: Usuario, obj_in: UsuarioUpdate) -> Usuario:
        data = obj_in.model_dump(exclude_unset=True, exclude={"senha"})
        if obj_in.senha:
            data["senha_hash"] = hash_password(obj_in.senha)
        for field, value in data.items():
            setattr(db_obj, field, value)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj


papeis = CRUDBase[Papel, PapelCreate, PapelUpdate](Papel)
usuarios = CRUDUsuario(Usuario)
cooperados = CRUDBase[Cooperado, CooperadoCreate, CooperadoUpdate](Cooperado)
empresas = CRUDBase[Empresa, EmpresaCreate, EmpresaUpdate](Empresa)
fazendas = CRUDBase[Fazenda, FazendaCreate, FazendaUpdate](Fazenda)
safras = CRUDBase[Safra, SafraCreate, SafraUpdate](Safra)
cultivares = CRUDBase[Cultivar, CultivarCreate, CultivarUpdate](Cultivar)
talhoes = CRUDBase[Talhao, TalhaoCreate, TalhaoUpdate](Talhao)
contratos = CRUDBase[Contrato, ContratoCreate, ContratoUpdate](Contrato)

inspecoes = CRUDBase[Inspecao, InspecaoCreate, InspecaoUpdate](Inspecao)
aplicacoes = CRUDBase[Aplicacao, AplicacaoCreate, AplicacaoUpdate](Aplicacao)
historico_climatico = CRUDBase[HistoricoClimatico, HistoricoClimaticoCreate, HistoricoClimaticoUpdate](
    HistoricoClimatico
)
analises_solo = CRUDBase[AnaliseSolo, AnaliseSoloCreate, AnaliseSoloUpdate](AnaliseSolo)
fotografias = CRUDBase[Fotografia, FotografiaCreate, FotografiaUpdate](Fotografia)

modelos_versoes = CRUDBase[ModeloVersao, ModeloVersaoCreate, ModeloVersaoUpdate](ModeloVersao)
pragas_catalogo = CRUDBase[PragaCatalogo, PragaCatalogoCreate, PragaCatalogoUpdate](PragaCatalogo)
doencas_catalogo = CRUDBase[DoencaCatalogo, DoencaCatalogoCreate, DoencaCatalogoUpdate](DoencaCatalogo)
plantas_daninhas_catalogo = CRUDBase[
    PlantaDaninhaCatalogo, PlantaDaninhaCatalogoCreate, PlantaDaninhaCatalogoUpdate
](PlantaDaninhaCatalogo)
ocorrencias_pragas = CRUDBase[OcorrenciaPraga, OcorrenciaPragaCreate, OcorrenciaPragaUpdate](OcorrenciaPraga)
ocorrencias_doencas = CRUDBase[OcorrenciaDoenca, OcorrenciaDoencaCreate, OcorrenciaDoencaUpdate](OcorrenciaDoenca)
ocorrencias_plantas_daninhas = CRUDBase[
    OcorrenciaPlantaDaninha, OcorrenciaPlantaDaninhaCreate, OcorrenciaPlantaDaninhaUpdate
](OcorrenciaPlantaDaninha)
plantas_atipicas_ocorrencias = CRUDBase[
    PlantaAtipicaOcorrencia, PlantaAtipicaOcorrenciaCreate, PlantaAtipicaOcorrenciaUpdate
](PlantaAtipicaOcorrencia)
ndvi_leituras = CRUDBase[NdviLeitura, NdviLeituraCreate, NdviLeituraUpdate](NdviLeitura)
produtividade_estimativas = CRUDBase[
    ProdutividadeEstimativa, ProdutividadeEstimativaCreate, ProdutividadeEstimativaUpdate
](ProdutividadeEstimativa)
colheita = CRUDBase[Colheita, ColheitaCreate, ColheitaUpdate](Colheita)

# Somente leitura via API -- escrita acontece apenas internamente, disparada
# pelo endpoint POST /plantas-atipicas/{id}/validar (ver api/routes/inteligencia.py).
validacoes_humanas = CRUDBase[ValidacaoHumana, BaseModel, BaseModel](ValidacaoHumana)

dataset_rotulos = CRUDBase[DatasetRotulo, DatasetRotuloCreate, DatasetRotuloUpdate](DatasetRotulo)
# Log imutavel: sem update via API (ver enable_update=False em api/routes/dados.py).
log_predicoes_ia = CRUDBase[LogPredicaoIA, LogPredicaoIACreate, BaseModel](LogPredicaoIA)
consentimentos_lgpd = CRUDBase[ConsentimentoLgpd, ConsentimentoLgpdCreate, ConsentimentoLgpdUpdate](
    ConsentimentoLgpd
)
sincronizacao_log = CRUDBase[SincronizacaoLog, SincronizacaoLogCreate, SincronizacaoLogUpdate](
    SincronizacaoLog
)
