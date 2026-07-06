from io import BytesIO

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from pydantic import BaseModel

from core.logging import log_operacao
from core.roles import campo_ou_rt_ou_admin
from core.storage import upload_file

router = APIRouter(prefix="/uploads", tags=["uploads"])

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic"}
MAX_SIZE_BYTES = 15 * 1024 * 1024  # 15 MB


class UploadResponse(BaseModel):
    url: str


@router.post("", response_model=UploadResponse, status_code=201)
async def upload(file: UploadFile, current_user=Depends(campo_ou_rt_ou_admin)):
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=415, detail=f"Tipo de arquivo não suportado: {file.content_type}")

    contents = await file.read()
    if len(contents) > MAX_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="Arquivo maior que 15 MB")

    url = upload_file(BytesIO(contents), file.filename or "foto.jpg", file.content_type)
    log_operacao(current_user, "uploads", "criar")
    return UploadResponse(url=url)
