from fastapi import FastAPI

from api.routes import health, nucleo

app = FastAPI(title="Agrônomo IA API")

app.include_router(health.router, prefix="/api", tags=["health"])
for router in nucleo.routers:
    app.include_router(router, prefix="/api")
