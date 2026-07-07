def test_login_success(client, make_user):
    make_user("Administrador", "admin_login_ok@test.com")
    resp = client.post(
        "/api/auth/login",
        data={"username": "admin_login_ok@test.com", "password": "senha123"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "access_token" in body
    assert "refresh_token" in body
    assert body["token_type"] == "bearer"


def test_login_wrong_password(client, make_user):
    make_user("Administrador", "admin_login_bad@test.com")
    resp = client.post(
        "/api/auth/login",
        data={"username": "admin_login_bad@test.com", "password": "errada"},
    )
    assert resp.status_code == 401


def test_login_unknown_user(client):
    resp = client.post(
        "/api/auth/login",
        data={"username": "naoexiste@test.com", "password": "qualquer"},
    )
    assert resp.status_code == 401


def test_protected_endpoint_requires_token(client):
    resp = client.get("/api/papeis")
    assert resp.status_code == 401


def test_protected_endpoint_rejects_garbage_token(client):
    resp = client.get("/api/papeis", headers={"Authorization": "Bearer token-invalido"})
    assert resp.status_code == 401


def test_refresh_token_flow(client, make_user):
    make_user("Administrador", "admin_refresh@test.com")
    login_resp = client.post(
        "/api/auth/login",
        data={"username": "admin_refresh@test.com", "password": "senha123"},
    )
    refresh_token = login_resp.json()["refresh_token"]

    resp = client.post("/api/auth/refresh", json={"refresh_token": refresh_token})
    assert resp.status_code == 200
    body = resp.json()
    assert "access_token" in body
    assert "refresh_token" in body


def test_refresh_rejects_invalid_token(client):
    resp = client.post("/api/auth/refresh", json={"refresh_token": "nao-e-um-jwt"})
    assert resp.status_code == 401


def test_refresh_rejects_access_token_used_as_refresh(client, make_user):
    make_user("Administrador", "admin_refresh_swap@test.com")
    login_resp = client.post(
        "/api/auth/login",
        data={"username": "admin_refresh_swap@test.com", "password": "senha123"},
    )
    access_token = login_resp.json()["access_token"]

    resp = client.post("/api/auth/refresh", json={"refresh_token": access_token})
    assert resp.status_code == 401
