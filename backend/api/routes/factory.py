from typing import Type
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from core.database import get_db
from crud import CRUDBase


def crud_router(
    *,
    crud: CRUDBase,
    read_schema: Type[BaseModel],
    create_schema: Type[BaseModel],
    update_schema: Type[BaseModel],
    prefix: str,
    tag: str,
) -> APIRouter:
    router = APIRouter(prefix=prefix, tags=[tag])

    @router.get("", response_model=list[read_schema])
    def list_(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
        return crud.list(db, skip=skip, limit=limit)

    @router.get("/{id}", response_model=read_schema)
    def get_(id: UUID, db: Session = Depends(get_db)):
        obj = crud.get(db, id)
        if not obj:
            raise HTTPException(status_code=404, detail=f"{tag} não encontrado")
        return obj

    @router.post("", response_model=read_schema, status_code=201)
    def create_(obj_in: create_schema, db: Session = Depends(get_db)):
        return crud.create(db, obj_in)

    @router.put("/{id}", response_model=read_schema)
    def update_(id: UUID, obj_in: update_schema, db: Session = Depends(get_db)):
        obj = crud.get(db, id)
        if not obj:
            raise HTTPException(status_code=404, detail=f"{tag} não encontrado")
        return crud.update(db, obj, obj_in)

    @router.delete("/{id}", status_code=204)
    def delete_(id: UUID, db: Session = Depends(get_db)):
        obj = crud.remove(db, id)
        if not obj:
            raise HTTPException(status_code=404, detail=f"{tag} não encontrado")

    return router
