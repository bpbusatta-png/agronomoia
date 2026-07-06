from typing import Callable, Optional, Type
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from core.database import get_db
from core.deps import get_current_user
from core.logging import log_operacao
from crud import CRUDBase


def crud_router(
    *,
    crud: CRUDBase,
    read_schema: Type[BaseModel],
    create_schema: Type[BaseModel],
    update_schema: Type[BaseModel],
    prefix: str,
    tag: str,
    read_dep: Callable = get_current_user,
    write_dep: Optional[Callable] = None,
    create_dep: Optional[Callable] = None,
    update_dep: Optional[Callable] = None,
    delete_dep: Optional[Callable] = None,
    inject_usuario_field: Optional[str] = None,
) -> APIRouter:
    write_dep = write_dep or read_dep
    create_dep = create_dep or write_dep
    update_dep = update_dep or write_dep
    delete_dep = delete_dep or write_dep
    router = APIRouter(prefix=prefix, tags=[tag])

    @router.get("", response_model=list[read_schema])
    def list_(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), _user=Depends(read_dep)):
        return crud.list(db, skip=skip, limit=limit)

    @router.get("/{id}", response_model=read_schema)
    def get_(id: UUID, db: Session = Depends(get_db), _user=Depends(read_dep)):
        obj = crud.get(db, id)
        if not obj:
            raise HTTPException(status_code=404, detail=f"{tag} não encontrado")
        return obj

    @router.post("", response_model=read_schema, status_code=201)
    def create_(obj_in: create_schema, db: Session = Depends(get_db), current_user=Depends(create_dep)):
        extra = {inject_usuario_field: current_user.id} if inject_usuario_field else {}
        obj = crud.create(db, obj_in, **extra)
        log_operacao(current_user, tag, "criar", obj.id)
        return obj

    @router.put("/{id}", response_model=read_schema)
    def update_(id: UUID, obj_in: update_schema, db: Session = Depends(get_db), current_user=Depends(update_dep)):
        obj = crud.get(db, id)
        if not obj:
            raise HTTPException(status_code=404, detail=f"{tag} não encontrado")
        obj = crud.update(db, obj, obj_in)
        log_operacao(current_user, tag, "editar", id)
        return obj

    @router.delete("/{id}", status_code=204)
    def delete_(id: UUID, db: Session = Depends(get_db), current_user=Depends(delete_dep)):
        obj = crud.remove(db, id)
        if not obj:
            raise HTTPException(status_code=404, detail=f"{tag} não encontrado")
        log_operacao(current_user, tag, "excluir", id)

    return router
