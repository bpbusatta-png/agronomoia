import os

# Forcado (nao setdefault) para garantir que os testes nunca acabem usando o
# banco de desenvolvimento por acidente, mesmo que DATABASE_URL ja esteja
# definida no ambiente. Precisa rodar antes de qualquer import de core.config/
# main/models (por isso fica no topo do conftest, que o pytest carrega antes
# dos test_*.py do mesmo diretorio).
os.environ["DATABASE_URL"] = os.environ.get(
    "TEST_DATABASE_URL",
    "postgresql+psycopg2://postgres:agronomo@127.0.0.1:5433/agronomo_ia_test",
)
os.environ["SECRET_KEY"] = "test-secret-key-nao-usar-em-producao"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402

from core.database import get_db  # noqa: E402
from core.security import hash_password  # noqa: E402
from main import app  # noqa: E402
from models import Papel, Usuario  # noqa: E402

PAPEIS = ["Administrador", "Agronomo_RT", "Tecnico_Campo", "Cooperado", "Consulta"]

_engine = create_engine(os.environ["DATABASE_URL"])


@pytest.fixture(scope="session", autouse=True)
def _seed_papeis():
    """Garante os 5 papeis padrao, commitados fora da transacao de cada
    teste (por isso usa sua propria conexao) para que fiquem visiveis a
    todos os testes sem precisar recriar a cada um."""
    Session = sessionmaker(bind=_engine)
    db = Session()
    try:
        for nome in PAPEIS:
            if not db.query(Papel).filter(Papel.nome == nome).first():
                db.add(Papel(nome=nome))
        db.commit()
    finally:
        db.close()


@pytest.fixture()
def db_session():
    """Uma conexao + transacao por teste, sempre revertida ao final --
    isolamento total sem precisar recriar o schema a cada teste."""
    connection = _engine.connect()
    transaction = connection.begin()
    Session = sessionmaker(bind=connection)
    session = Session()
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture()
def client(db_session):
    """TestClient com o get_db do app substituido pela sessao de teste --
    tudo que o endpoint enxerga roda na mesma transacao do teste."""

    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def make_user(db_session):
    def _make(papel_nome: str, email: str, senha: str = "senha123") -> Usuario:
        papel = db_session.query(Papel).filter(Papel.nome == papel_nome).first()
        assert papel is not None, f"papel '{papel_nome}' nao encontrado -- _seed_papeis rodou?"
        usuario = Usuario(nome=email, email=email, senha_hash=hash_password(senha), papel_id=papel.id)
        db_session.add(usuario)
        db_session.commit()
        db_session.refresh(usuario)
        return usuario

    return _make


@pytest.fixture()
def auth_headers(client):
    def _headers(email: str, senha: str = "senha123") -> dict:
        resp = client.post("/api/auth/login", data={"username": email, "password": senha})
        assert resp.status_code == 200, resp.text
        token = resp.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}

    return _headers
