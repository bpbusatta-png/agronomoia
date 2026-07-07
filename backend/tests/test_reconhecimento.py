import io
from unittest.mock import patch

from core.ai_vision import AIVisionNotConfigured

_RESULTADO_MOCK = {
    "tipo_identificado": "praga",
    "nome_sugerido": "Lagarta-da-soja",
    "confianca": 0.87,
    "observacoes": "Lesao foliar compativel com desfolha por lagarta.",
}


def _criar_talhao(client, headers, sufixo: str) -> str:
    coop = client.post(
        "/api/cooperados", json={"codigo": f"CR-{sufixo}", "nome": f"Coop R {sufixo}"}, headers=headers
    ).json()
    fazenda = client.post(
        "/api/fazendas", json={"cooperado_id": coop["id"], "nome": f"Fazenda R {sufixo}"}, headers=headers
    ).json()
    talhao = client.post(
        "/api/talhoes", json={"fazenda_id": fazenda["id"], "codigo": f"T-R-{sufixo}"}, headers=headers
    ).json()
    return talhao["id"]


def test_classificar_retorna_sugestao_e_registra_log_predicao(client, make_user, auth_headers):
    make_user("Administrador", "admin_reco_1@test.com")
    headers = auth_headers("admin_reco_1@test.com")

    with patch("api.routes.reconhecimento.classificar_imagem", return_value=_RESULTADO_MOCK):
        resp = client.post(
            "/api/reconhecimento/classificar",
            files={"file": ("foto.jpg", io.BytesIO(b"fake-bytes"), "image/jpeg")},
            data={"tipo_esperado": "praga"},
            headers=headers,
        )
    assert resp.status_code == 201
    body = resp.json()
    assert body["tipo_identificado"] == "praga"
    assert body["nome_sugerido"] == "Lagarta-da-soja"
    assert body["confianca"] == 0.87
    assert body["modelo_versao_id"]

    log = client.get("/api/log-predicoes-ia", headers=headers)
    assert log.status_code == 200
    registros = [
        r for r in log.json() if r["saida_predita"] and r["saida_predita"].get("nome_sugerido") == "Lagarta-da-soja"
    ]
    assert len(registros) == 1
    assert registros[0]["confianca"] == "0.870"


def test_classificar_reusa_a_mesma_versao_de_modelo_entre_chamadas(client, make_user, auth_headers):
    make_user("Administrador", "admin_reco_2@test.com")
    headers = auth_headers("admin_reco_2@test.com")

    with patch("api.routes.reconhecimento.classificar_imagem", return_value=_RESULTADO_MOCK):
        resp1 = client.post(
            "/api/reconhecimento/classificar",
            files={"file": ("foto1.jpg", io.BytesIO(b"a"), "image/jpeg")},
            headers=headers,
        )
        resp2 = client.post(
            "/api/reconhecimento/classificar",
            files={"file": ("foto2.jpg", io.BytesIO(b"b"), "image/jpeg")},
            headers=headers,
        )
    assert resp1.json()["modelo_versao_id"] == resp2.json()["modelo_versao_id"]


def test_classificar_sem_api_key_configurada_retorna_503(client, make_user, auth_headers):
    make_user("Tecnico_Campo", "tec_reco_503@test.com")
    headers = auth_headers("tec_reco_503@test.com")

    with patch("api.routes.reconhecimento.classificar_imagem", side_effect=AIVisionNotConfigured("sem chave")):
        resp = client.post(
            "/api/reconhecimento/classificar",
            files={"file": ("foto.jpg", io.BytesIO(b"a"), "image/jpeg")},
            headers=headers,
        )
    assert resp.status_code == 503


def test_classificar_rejeita_tipo_de_arquivo_invalido(client, make_user, auth_headers):
    make_user("Tecnico_Campo", "tec_reco_415@test.com")
    headers = auth_headers("tec_reco_415@test.com")

    resp = client.post(
        "/api/reconhecimento/classificar",
        files={"file": ("foto.txt", io.BytesIO(b"nao e imagem"), "text/plain")},
        headers=headers,
    )
    assert resp.status_code == 415


def test_classificar_exige_autenticacao(client):
    resp = client.post(
        "/api/reconhecimento/classificar",
        files={"file": ("foto.jpg", io.BytesIO(b"a"), "image/jpeg")},
    )
    assert resp.status_code == 401


def test_cooperado_nao_pode_classificar(client, make_user, auth_headers):
    make_user("Cooperado", "coop_reco@test.com")
    headers = auth_headers("coop_reco@test.com")

    with patch("api.routes.reconhecimento.classificar_imagem", return_value=_RESULTADO_MOCK):
        resp = client.post(
            "/api/reconhecimento/classificar",
            files={"file": ("foto.jpg", io.BytesIO(b"a"), "image/jpeg")},
            headers=headers,
        )
    assert resp.status_code == 403


def test_ocorrencia_com_sugestao_da_ia_vira_rotulo_no_dataset(client, make_user, auth_headers):
    make_user("Administrador", "admin_reco_hibrido@test.com")
    headers = auth_headers("admin_reco_hibrido@test.com")
    talhao_id = _criar_talhao(client, headers, "hib")
    praga = client.post("/api/pragas-catalogo", json={"nome_comum": "Lagarta"}, headers=headers).json()

    with patch("api.routes.reconhecimento.classificar_imagem", return_value=_RESULTADO_MOCK):
        classificacao = client.post(
            "/api/reconhecimento/classificar",
            files={"file": ("foto.jpg", io.BytesIO(b"a"), "image/jpeg")},
            headers=headers,
        ).json()
    modelo_versao_id = classificacao["modelo_versao_id"]

    fotografia = client.post(
        "/api/fotografias",
        json={"talhao_id": talhao_id, "url_arquivo": "http://fake/x.jpg", "tipo": "praga"},
        headers=headers,
    ).json()

    ocorrencia = client.post(
        "/api/ocorrencias-pragas",
        json={
            "talhao_id": talhao_id,
            "praga_id": praga["id"],
            "fotografia_id": fotografia["id"],
            "modelo_versao_id": modelo_versao_id,
            "confianca_modelo": 0.87,
        },
        headers=headers,
    )
    assert ocorrencia.status_code == 201

    rotulos = client.get("/api/dataset-rotulos", headers=headers)
    assert rotulos.status_code == 200
    correspondentes = [r for r in rotulos.json() if r["fotografia_id"] == fotografia["id"]]
    assert len(correspondentes) == 1
    assert correspondentes[0]["tipo_rotulo"] == "pragas"
    assert correspondentes[0]["rotulo_valor"] == {"praga_id": praga["id"]}
    assert correspondentes[0]["rotulado_por"] is not None


def test_ocorrencia_sem_modelo_versao_nao_gera_rotulo(client, make_user, auth_headers):
    make_user("Administrador", "admin_reco_sem_ia@test.com")
    headers = auth_headers("admin_reco_sem_ia@test.com")
    talhao_id = _criar_talhao(client, headers, "semia")
    praga = client.post("/api/pragas-catalogo", json={"nome_comum": "Percevejo"}, headers=headers).json()

    fotografia = client.post(
        "/api/fotografias",
        json={"talhao_id": talhao_id, "url_arquivo": "http://fake/y.jpg", "tipo": "praga"},
        headers=headers,
    ).json()

    ocorrencia = client.post(
        "/api/ocorrencias-pragas",
        json={"talhao_id": talhao_id, "praga_id": praga["id"], "fotografia_id": fotografia["id"]},
        headers=headers,
    )
    assert ocorrencia.status_code == 201

    rotulos = client.get("/api/dataset-rotulos", headers=headers)
    correspondentes = [r for r in rotulos.json() if r["fotografia_id"] == fotografia["id"]]
    assert len(correspondentes) == 0
