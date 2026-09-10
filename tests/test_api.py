from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
import uuid
import os
from sqlalchemy.orm import Session

from backend.api.main import app
from backend.core.db import SessionLocal
from backend.core.models import Connection

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


def test_discover_schema_persists_state():
    db_file = f"./test-{uuid.uuid4().hex}.db"
    engine = create_engine(f"sqlite:///{db_file}")
    with engine.begin() as conn:
        conn.execute(text("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, email TEXT)"))

    org = client.post("/organizations", json={"name": f"SchemaOrg-{uuid.uuid4().hex}"})
    org_id = org.json()["id"]
    payload = {
        "organization_id": org_id,
        "name": "schema-conn",
        "source_type": "postgres",
        "source_config": {"dsn": f"sqlite:///{db_file}", "table": "users", "incremental_key": "id"},
        "destination_type": "s3",
        "destination_config": {"bucket": "example-bucket", "key_prefix": "runs"},
        "schedule_minutes": 15,
        "sync_mode": "incremental",
    }
    conn_resp = client.post("/connections", json=payload)
    connection_id = conn_resp.json()["id"]

    discover = client.post(f"/connections/{connection_id}/discover-schema")
    assert discover.status_code == 200
    assert discover.json()["schema"]["table"] == "users"
    assert any(col["name"] == "id" for col in discover.json()["schema"]["columns"])

    db: Session = SessionLocal()
    try:
        saved_conn = db.get(Connection, connection_id)
        assert saved_conn is not None
        assert "schema" in saved_conn.state_json
        assert saved_conn.state_json["schema"]["table"] == "users"
    finally:
        db.close()
        if os.path.exists(db_file):
            os.remove(db_file)
