import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import auth, dados, health, inteligencia, monitoramento, nucleo, reconhecimento, uploads
from core.storage import ensure_bucket

app = FastAPI(title="Agrônomo IA API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:8081"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _ensure_storage_bucket() -> None:
    try:
        ensure_bucket()
    except Exception as exc:
        logging.getLogger("uvicorn.error").warning(
            "Storage (MinIO) indisponível na inicialização — upload de fotos ficará fora do ar: %s", exc
        )


app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(auth.router, prefix="/api")
app.include_router(uploads.router, prefix="/api")
app.include_router(reconhecimento.router, prefix="/api")
for router in nucleo.routers + monitoramento.routers + inteligencia.routers + dados.routers:
    app.include_router(router, prefix="/api")
