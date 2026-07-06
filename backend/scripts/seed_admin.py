"""Cria os papeis padrao e um usuario Administrador inicial em um banco novo.

Necessario porque o endpoint POST /api/usuarios exige um Administrador
autenticado -- sem isso nao haveria como criar o primeiro usuario via API.

Uso: cd backend && .venv/Scripts/python scripts/seed_admin.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from core.database import SessionLocal  # noqa: E402
from core.security import hash_password  # noqa: E402
from models import Papel, Usuario  # noqa: E402

PAPEIS = ["Administrador", "Agronomo_RT", "Tecnico_Campo", "Cooperado", "Consulta"]
ADMIN_EMAIL = "admin@agronomo.ia"
ADMIN_SENHA_INICIAL = "troque-esta-senha"


def run() -> None:
    db = SessionLocal()
    try:
        papel_por_nome = {}
        for nome in PAPEIS:
            papel = db.query(Papel).filter(Papel.nome == nome).first()
            if not papel:
                papel = Papel(nome=nome)
                db.add(papel)
                db.flush()
            papel_por_nome[nome] = papel

        if not db.query(Usuario).filter(Usuario.email == ADMIN_EMAIL).first():
            admin = Usuario(
                nome="Administrador",
                email=ADMIN_EMAIL,
                senha_hash=hash_password(ADMIN_SENHA_INICIAL),
                papel_id=papel_por_nome["Administrador"].id,
            )
            db.add(admin)
            print(f"Usuario admin criado: {ADMIN_EMAIL} / {ADMIN_SENHA_INICIAL} (troque a senha)")
        else:
            print("Usuario admin ja existe, nada a fazer.")

        db.commit()
        print("Papeis garantidos:", ", ".join(PAPEIS))
    finally:
        db.close()


if __name__ == "__main__":
    run()
