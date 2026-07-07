import io
from unittest.mock import patch


def test_upload_valid_image(client, make_user, auth_headers):
    make_user("Tecnico_Campo", "tec_upload_ok@test.com")
    headers = auth_headers("tec_upload_ok@test.com")

    with patch("api.routes.uploads.upload_file", return_value="http://fake-storage/test.png"):
        resp = client.post(
            "/api/uploads",
            files={"file": ("test.png", io.BytesIO(b"fake-image-bytes"), "image/png")},
            headers=headers,
        )
    assert resp.status_code == 201
    assert resp.json()["url"] == "http://fake-storage/test.png"


def test_upload_rejects_invalid_content_type(client, make_user, auth_headers):
    make_user("Tecnico_Campo", "tec_upload_bad_type@test.com")
    headers = auth_headers("tec_upload_bad_type@test.com")

    resp = client.post(
        "/api/uploads",
        files={"file": ("test.txt", io.BytesIO(b"nao e uma imagem"), "text/plain")},
        headers=headers,
    )
    assert resp.status_code == 415


def test_upload_rejects_oversized_file(client, make_user, auth_headers):
    make_user("Tecnico_Campo", "tec_upload_oversize@test.com")
    headers = auth_headers("tec_upload_oversize@test.com")

    oversized = b"0" * (15 * 1024 * 1024 + 1)
    resp = client.post(
        "/api/uploads",
        files={"file": ("grande.png", io.BytesIO(oversized), "image/png")},
        headers=headers,
    )
    assert resp.status_code == 413


def test_upload_requires_auth(client):
    resp = client.post(
        "/api/uploads",
        files={"file": ("test.png", io.BytesIO(b"data"), "image/png")},
    )
    assert resp.status_code == 401


def test_cooperado_role_cannot_upload(client, make_user, auth_headers):
    make_user("Cooperado", "coop_user_upload@test.com")
    headers = auth_headers("coop_user_upload@test.com")

    with patch("api.routes.uploads.upload_file", return_value="http://fake-storage/x.png"):
        resp = client.post(
            "/api/uploads",
            files={"file": ("test.png", io.BytesIO(b"data"), "image/png")},
            headers=headers,
        )
    assert resp.status_code == 403
