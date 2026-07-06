from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session, joinedload

from core.database import get_db
from core.security import decode_token
from models import Usuario

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

CREDENTIALS_ERROR = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Credenciais inválidas",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Usuario:
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise CREDENTIALS_ERROR
        user_id = UUID(payload["sub"])
    except Exception:
        raise CREDENTIALS_ERROR

    usuario = (
        db.query(Usuario)
        .options(joinedload(Usuario.papel))
        .filter(Usuario.id == user_id)
        .first()
    )
    if not usuario or not usuario.ativo:
        raise CREDENTIALS_ERROR
    return usuario


def require_roles(*role_names: str):
    def dependency(current_user: Usuario = Depends(get_current_user)) -> Usuario:
        role = current_user.papel.nome if current_user.papel else None
        if role not in role_names:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permissão insuficiente para esta operação",
            )
        return current_user

    return dependency
