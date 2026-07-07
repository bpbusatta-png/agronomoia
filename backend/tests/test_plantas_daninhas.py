def _criar_talhao(client, headers, sufixo: str) -> str:
    coop = client.post(
        "/api/cooperados", json={"codigo": f"CPD-{sufixo}", "nome": f"Coop PD {sufixo}"}, headers=headers
    ).json()
    fazenda = client.post(
        "/api/fazendas", json={"cooperado_id": coop["id"], "nome": f"Fazenda PD {sufixo}"}, headers=headers
    ).json()
    talhao = client.post(
        "/api/talhoes", json={"fazenda_id": fazenda["id"], "codigo": f"T-PD-{sufixo}"}, headers=headers
    ).json()
    return talhao["id"]


def test_admin_pode_criar_catalogo_tecnico_nao(client, make_user, auth_headers):
    make_user("Administrador", "admin_pd_catalogo@test.com")
    admin_headers = auth_headers("admin_pd_catalogo@test.com")
    resp = client.post(
        "/api/plantas-daninhas-catalogo",
        json={"nome_comum": "Buva", "nome_cientifico": "Conyza spp.", "ciclo": "anual"},
        headers=admin_headers,
    )
    assert resp.status_code == 201

    make_user("Tecnico_Campo", "tec_pd_catalogo@test.com")
    tec_headers = auth_headers("tec_pd_catalogo@test.com")
    resp2 = client.post(
        "/api/plantas-daninhas-catalogo",
        json={"nome_comum": "Capim-amargoso"},
        headers=tec_headers,
    )
    assert resp2.status_code == 403


def test_tecnico_pode_criar_ocorrencia_mas_nao_editar_nem_excluir(client, make_user, auth_headers):
    make_user("Administrador", "admin_pd_1@test.com")
    admin_headers = auth_headers("admin_pd_1@test.com")
    talhao_id = _criar_talhao(client, admin_headers, "1")
    daninha = client.post(
        "/api/plantas-daninhas-catalogo", json={"nome_comum": "Buva"}, headers=admin_headers
    ).json()

    make_user("Tecnico_Campo", "tec_pd_1@test.com")
    tec_headers = auth_headers("tec_pd_1@test.com")

    create = client.post(
        "/api/ocorrencias-plantas-daninhas",
        json={"talhao_id": talhao_id, "planta_daninha_id": daninha["id"], "nivel_infestacao": "alto"},
        headers=tec_headers,
    )
    assert create.status_code == 201
    ocorrencia_id = create.json()["id"]

    editar = client.put(
        f"/api/ocorrencias-plantas-daninhas/{ocorrencia_id}",
        json={"nivel_infestacao": "baixo"},
        headers=tec_headers,
    )
    assert editar.status_code == 403

    excluir = client.delete(f"/api/ocorrencias-plantas-daninhas/{ocorrencia_id}", headers=tec_headers)
    assert excluir.status_code == 403


def test_full_crud_cycle_admin(client, make_user, auth_headers):
    make_user("Administrador", "admin_pd_2@test.com")
    headers = auth_headers("admin_pd_2@test.com")
    talhao_id = _criar_talhao(client, headers, "2")
    daninha = client.post("/api/plantas-daninhas-catalogo", json={"nome_comum": "Trapoeraba"}, headers=headers).json()

    create = client.post(
        "/api/ocorrencias-plantas-daninhas",
        json={"talhao_id": talhao_id, "planta_daninha_id": daninha["id"], "nivel_infestacao": "medio"},
        headers=headers,
    )
    assert create.status_code == 201
    ocorrencia_id = create.json()["id"]

    get_resp = client.get(f"/api/ocorrencias-plantas-daninhas/{ocorrencia_id}", headers=headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["nivel_infestacao"] == "medio"

    put_resp = client.put(
        f"/api/ocorrencias-plantas-daninhas/{ocorrencia_id}", json={"nivel_infestacao": "alto"}, headers=headers
    )
    assert put_resp.status_code == 200
    assert put_resp.json()["nivel_infestacao"] == "alto"

    delete_resp = client.delete(f"/api/ocorrencias-plantas-daninhas/{ocorrencia_id}", headers=headers)
    assert delete_resp.status_code == 204

    get_after_delete = client.get(f"/api/ocorrencias-plantas-daninhas/{ocorrencia_id}", headers=headers)
    assert get_after_delete.status_code == 404
