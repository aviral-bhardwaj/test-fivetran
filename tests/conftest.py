import os

import pytest
from sqlalchemy import create_engine, text

os.environ["DATAPLATFORM_DATABASE_URL"] = "sqlite:///./test_control_plane.db"

from backend.api.main import app  # noqa: E402
from backend.core.db import Base, SessionLocal, engine  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client_with_sync_job():
    db = SessionLocal()
    try:
        source_engine = create_engine("sqlite:///./test_source.db")
        with source_engine.begin() as conn:
            conn.execute(text("CREATE TABLE IF NOT EXISTS src_users (id INTEGER PRIMARY KEY, name TEXT)"))
            conn.execute(text("CREATE TABLE IF NOT EXISTS dest_users (id INTEGER PRIMARY KEY, name TEXT)"))
            conn.execute(text("DELETE FROM src_users"))
            conn.execute(text("DELETE FROM dest_users"))
            conn.execute(text("INSERT INTO src_users(id, name) VALUES (1, 'alice')"))

        db.execute(text("INSERT INTO organizations(name, created_at) VALUES ('Org', CURRENT_TIMESTAMP)"))
        org_id = db.execute(text("SELECT id FROM organizations ORDER BY id DESC LIMIT 1")).first()[0]
        db.execute(
            text(
                """
                INSERT INTO connections(
                    organization_id, name, source_type, source_config,
                    destination_type, destination_config, schedule_minutes, sync_mode,
                    state_json, created_at
                ) VALUES (
                    :org_id, 'conn', 'postgres', :source_cfg,
                    'postgres', :dest_cfg, 60, 'full',
                    '{}', CURRENT_TIMESTAMP
                )
                """
            ),
            {
                "org_id": org_id,
                "source_cfg": '{"dsn":"sqlite:///./test_source.db","table":"src_users"}',
                "dest_cfg": '{"dsn":"sqlite:///./test_source.db","table":"dest_users"}',
            },
        )
        connection_id = db.execute(text("SELECT id FROM connections ORDER BY id DESC LIMIT 1")).first()[0]
        db.execute(text("INSERT INTO sync_jobs(connection_id, status, trigger, requested_at, run_at, attempts, rows_synced) VALUES (:id, 'pending', 'manual', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 0)"), {"id": connection_id})
        job_id = db.execute(text("SELECT id FROM sync_jobs ORDER BY id DESC LIMIT 1")).first()[0]
        db.commit()
        yield job_id
    finally:
        db.close()
