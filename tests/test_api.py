from fastapi.testclient import TestClient

from backend.api.main import app

client = TestClient(app)


def test_healthz():
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_organization_and_connection_create():
    org = client.post("/organizations", json={"name": "Acme"})
    assert org.status_code == 200
    org_id = org.json()["id"]

    payload = {
        "organization_id": org_id,
        "name": "pg-to-s3",
        "source_type": "postgres",
        "source_config": {"dsn": "sqlite:///./test.db", "table": "users", "incremental_key": "id"},
        "destination_type": "s3",
        "destination_config": {"bucket": "example-bucket", "key_prefix": "runs"},
        "schedule_minutes": 15,
        "sync_mode": "incremental",
    }

    conn = client.post("/connections", json=payload)
    assert conn.status_code == 200
    assert conn.json()["name"] == "pg-to-s3"


def test_sync_enqueue_not_found_connection():
    response = client.post("/connections/9999/syncs")
    assert response.status_code == 404
