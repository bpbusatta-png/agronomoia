def _criar_talhao(client, headers, sufixo: str) -> str:
    coop = client.post(
        "/api/cooperados", json={"codigo": f"CPA-{sufixo}", "nome": f"Coop PA {sufixo}"}, headers=headers
    ).json()
    fazenda = client.post(
        "/api/fazendas", json={"cooperado_id": coop["id"], "nome": f"Fazenda PA {sufixo}"}, headers=headers
    ).json()
    talhao = client.post(
        "/api/talhoes", json={"fazenda_id": fazenda["id"], "codigo": f"T-PA-{sufixo}"}, headers=headers
    ).json()
    return talhao["id"]


def test_ocorrencia_nasce_pendente_sem_validador(client, make_user, auth_headers):
    make_user("Administrador", "admin_pa_1@test.com")
    headers = auth_headers("admin_pa_1@test.com")
    talhao_id = _criar_talhao(client, headers, "1")

    resp = client.post(
        "/api/plantas-atipicas",
        json={"talhao_id": talhao_id, "caracteristica_avaliada": "cor_flor"},
        headers=headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["status"] == "pendente_validacao"
    assert body["validado_por"] is None
    assert body["recomendacao"] is None


def test_cliente_nao_consegue_forjar_validado_por_no_create(client, make_user, auth_headers):
    make_user("Administrador", "admin_pa_2@test.com")
    headers = auth_headers("admin_pa_2@test.com")
    talhao_id = _criar_talhao(client, headers, "2")

    resp = client.post(
        "/api/plantas-atipicas",
        json={
            "talhao_id": talhao_id,
            "validado_por": "11111111-1111-1111-1111-111111111111",
            "status": "validado",
        },
        headers=headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    # validado_por/status nao existem no schema de Create -- nasce pendente
    # de qualquer forma, independente do que o cliente tentar enviar.
    assert body["status"] == "pendente_validacao"
    assert body["validado_por"] is None


def test_tecnico_pode_criar_mas_nao_validar_nem_editar(client, make_user, auth_headers):
    make_user("Administrador", "admin_pa_3@test.com")
    admin_headers = auth_headers("admin_pa_3@test.com")
    talhao_id = _criar_talhao(client, admin_headers, "3")

    make_user("Tecnico_Campo", "tec_pa_3@test.com")
    tec_headers = auth_headers("tec_pa_3@test.com")

    create = client.post("/api/plantas-atipicas", json={"talhao_id": talhao_id}, headers=tec_headers)
    assert create.status_code == 201
    ocorrencia_id = create.json()["id"]

    validar = client.post(
        f"/api/plantas-atipicas/{ocorrencia_id}/validar",
        json={"decisao": "manter"},
        headers=tec_headers,
    )
    assert validar.status_code == 403

    editar = client.put(
        f"/api/plantas-atipicas/{ocorrencia_id}",
        json={"justificativa_tecnica": "tentando editar"},
        headers=tec_headers,
    )
    assert editar.status_code == 403


def test_validacao_completa_atualiza_status_e_registra_auditoria(client, make_user, auth_headers):
    make_user("Administrador", "admin_pa_4@test.com")
    headers = auth_headers("admin_pa_4@test.com")
    talhao_id = _criar_talhao(client, headers, "4")

    create = client.post("/api/plantas-atipicas", json={"talhao_id": talhao_id}, headers=headers)
    ocorrencia_id = create.json()["id"]

    validar = client.post(
        f"/api/plantas-atipicas/{ocorrencia_id}/validar",
        json={"decisao": "eliminar", "justificativa": "fora do padrao da cultivar"},
        headers=headers,
    )
    assert validar.status_code == 200
    body = validar.json()
    assert body["status"] == "validado"
    assert body["recomendacao"] == "eliminar"
    assert body["validado_por"] is not None

    auditoria = client.get("/api/validacoes-humanas", headers=headers)
    assert auditoria.status_code == 200
    registros = [e for e in auditoria.json() if e["entidade_id"] == ocorrencia_id]
    assert len(registros) == 1
    assert registros[0]["decisao"] == "eliminar"
    assert registros[0]["entidade_referenciada"] == "plantas_atipicas_ocorrencias"


def test_validar_ocorrencia_inexistente_retorna_404(client, make_user, auth_headers):
    make_user("Administrador", "admin_pa_5@test.com")
    headers = auth_headers("admin_pa_5@test.com")
    resp = client.post(
        "/api/plantas-atipicas/00000000-0000-0000-0000-000000000000/validar",
        json={"decisao": "manter"},
        headers=headers,
    )
    assert resp.status_code == 404


def test_consulta_nao_pode_ver_auditoria(client, make_user, auth_headers):
    make_user("Consulta", "consulta_pa_6@test.com")
    headers = auth_headers("consulta_pa_6@test.com")
    resp = client.get("/api/validacoes-humanas", headers=headers)
    assert resp.status_code == 403
