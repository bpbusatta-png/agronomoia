from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import auth, dados, health, inteligencia, monitoramento, nucleo

app = FastAPI(title="Agrônomo IA API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(auth.router, prefix="/api")
for router in nucleo.routers + monitoramento.routers + inteligencia.routers + dados.routers:
    app.include_router(router, prefix="/api")
