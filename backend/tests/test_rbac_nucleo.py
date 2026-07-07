def test_admin_can_create_cooperado(client, make_user, auth_headers):
    make_user("Administrador", "admin_create_coop@test.com")
    headers = auth_headers("admin_create_coop@test.com")
    resp = client.post("/api/cooperados", json={"codigo": "C1", "nome": "Coop 1"}, headers=headers)
    assert resp.status_code == 201


def test_tecnico_cannot_create_cooperado(client, make_user, auth_headers):
    make_user("Tecnico_Campo", "tec_no_coop@test.com")
    headers = auth_headers("tec_no_coop@test.com")
    resp = client.post("/api/cooperados", json={"codigo": "C2", "nome": "Coop 2"}, headers=headers)
    assert resp.status_code == 403


def test_agronomo_rt_can_create_cooperado(client, make_user, auth_headers):
    make_user("Agronomo_RT", "rt_coop@test.com")
    headers = auth_headers("rt_coop@test.com")
    resp = client.post("/api/cooperados", json={"codigo": "C3", "nome": "Coop 3"}, headers=headers)
    assert resp.status_code == 201


def test_consulta_can_read_but_not_write(client, make_user, auth_headers):
    make_user("Consulta", "consulta_readonly@test.com")
    headers = auth_headers("consulta_readonly@test.com")

    read_resp = client.get("/api/cooperados", headers=headers)
    assert read_resp.status_code == 200

    write_resp = client.post("/api/cooperados", json={"codigo": "C4", "nome": "Coop 4"}, headers=headers)
    assert write_resp.status_code == 403


def test_full_crud_cycle_admin(client, make_user, auth_headers):
    make_user("Administrador", "admin_full_cycle@test.com")
    headers = auth_headers("admin_full_cycle@test.com")

    create = client.post("/api/cooperados", json={"codigo": "C5", "nome": "Coop 5"}, headers=headers)
    assert create.status_code == 201
    cooperado_id = create.json()["id"]

    get_resp = client.get(f"/api/cooperados/{cooperado_id}", headers=headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["codigo"] == "C5"

    put_resp = client.put(
        f"/api/cooperados/{cooperado_id}", json={"nome": "Coop 5 Editado"}, headers=headers
    )
    assert put_resp.status_code == 200
    assert put_resp.json()["nome"] == "Coop 5 Editado"
    assert put_resp.json()["codigo"] == "C5"  # PUT parcial nao apaga o resto

    delete_resp = client.delete(f"/api/cooperados/{cooperado_id}", headers=headers)
    assert delete_resp.status_code == 204

    get_after_delete = client.get(f"/api/cooperados/{cooperado_id}", headers=headers)
    assert get_after_delete.status_code == 404


def test_get_nonexistent_returns_404(client, make_user, auth_headers):
    make_user("Administrador", "admin_404@test.com")
    headers = auth_headers("admin_404@test.com")
    resp = client.get("/api/cooperados/00000000-0000-0000-0000-000000000000", headers=headers)
    assert resp.status_code == 404


def test_usuarios_write_restricted_to_admin(client, make_user, auth_headers):
    make_user("Agronomo_RT", "rt_no_usuarios@test.com")
    headers = auth_headers("rt_no_usuarios@test.com")
    resp = client.post(
        "/api/usuarios",
        json={"nome": "X", "email": "x_criado_por_rt@test.com", "senha": "123456"},
        headers=headers,
    )
    assert resp.status_code == 403


def test_usuario_senha_hash_never_returned(client, make_user, auth_headers):
    make_user("Administrador", "admin_senha_hash@test.com")
    headers = auth_headers("admin_senha_hash@test.com")
    resp = client.post(
        "/api/usuarios",
        json={"nome": "Y", "email": "y_novo@test.com", "senha": "123456"},
        headers=headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert "senha_hash" not in body
    assert "senha" not in body
