from fastapi import FastAPI

from api.routes import health

app = FastAPI(title="Agrônomo IA API")

app.include_router(health.router, prefix="/api", tags=["health"])
