from typing import Generic, List, Optional, Type, TypeVar
from uuid import UUID

from pydantic import BaseModel
from sqlalchemy.orm import Session

from core.security import hash_password
from models import Contrato, Cooperado, Cultivar, Empresa, Fazenda, Papel, Safra, Talhao, Usuario
from schemas.contrato import ContratoCreate, ContratoUpdate
from schemas.cooperado import CooperadoCreate, CooperadoUpdate
from schemas.cultivar import CultivarCreate, CultivarUpdate
from schemas.empresa import EmpresaCreate, EmpresaUpdate
from schemas.fazenda import FazendaCreate, FazendaUpdate
from schemas.papel import PapelCreate, PapelUpdate
from schemas.safra import SafraCreate, SafraUpdate
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

    def create(self, db: Session, obj_in: CreateSchemaType) -> ModelType:
        obj = self.model(**obj_in.model_dump())
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
