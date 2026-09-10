import os
import uuid

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
    source_db_file = f"./test-source-{uuid.uuid4().hex}.db"
    try:
        source_engine = create_engine(f"sqlite:///{source_db_file}")
        with source_engine.begin() as conn:
            conn.execute(text("CREATE TABLE IF NOT EXISTS src_users (id INTEGER PRIMARY KEY, name TEXT)"))
            conn.execute(text("CREATE TABLE IF NOT EXISTS dest_users (id INTEGER PRIMARY KEY, name TEXT)"))
            conn.execute(text("DELETE FROM src_users"))
            conn.execute(text("DELETE FROM dest_users"))
            conn.execute(text("INSERT INTO src_users(id, name) VALUES (1, 'alice')"))

        org_id = db.execute(
            text("INSERT INTO organizations(name, created_at) VALUES (:name, CURRENT_TIMESTAMP) RETURNING id"),
            {"name": f"Org-{uuid.uuid4().hex}"},
        ).scalar_one()
        connection_id = db.execute(
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
                RETURNING id
                """
            ),
            {
                "org_id": org_id,
                "source_cfg": f'{{"dsn":"sqlite:///{source_db_file}","table":"src_users"}}',
                "dest_cfg": f'{{"dsn":"sqlite:///{source_db_file}","table":"dest_users"}}',
            },
        ).scalar_one()
        job_id = db.execute(
            text(
                "INSERT INTO sync_jobs(connection_id, status, trigger, requested_at, run_at, attempts, rows_synced) "
                "VALUES (:id, 'pending', 'manual', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 0) RETURNING id"
            ),
            {"id": connection_id},
        ).scalar_one()
        db.commit()
        yield job_id
    finally:
        db.close()
        if os.path.exists(source_db_file):
            os.remove(source_db_file)


@pytest.fixture
def incremental_sync_job():
    db = SessionLocal()
    source_db_file = f"./test-source-{uuid.uuid4().hex}.db"
    try:
        source_engine = create_engine(f"sqlite:///{source_db_file}")
        with source_engine.begin() as conn:
            conn.execute(text("CREATE TABLE IF NOT EXISTS src_users (id INTEGER PRIMARY KEY, name TEXT)"))
            conn.execute(text("CREATE TABLE IF NOT EXISTS dest_users (id INTEGER PRIMARY KEY, name TEXT)"))
            conn.execute(text("DELETE FROM src_users"))
            conn.execute(text("DELETE FROM dest_users"))
            conn.execute(text("INSERT INTO src_users(id, name) VALUES (1, 'alice')"))
            conn.execute(text("INSERT INTO src_users(id, name) VALUES (2, 'bob')"))

        org_id = db.execute(
            text("INSERT INTO organizations(name, created_at) VALUES (:name, CURRENT_TIMESTAMP) RETURNING id"),
            {"name": f"IncOrg-{uuid.uuid4().hex}"},
        ).scalar_one()
        connection_id = db.execute(
            text(
                """
                INSERT INTO connections(
                    organization_id, name, source_type, source_config,
                    destination_type, destination_config, schedule_minutes, sync_mode,
                    state_json, created_at
                ) VALUES (
                    :org_id, 'inc-conn', 'postgres', :source_cfg,
                    'postgres', :dest_cfg, 60, 'incremental',
                    :state_json, CURRENT_TIMESTAMP
                )
                RETURNING id
                """
            ),
            {
                "org_id": org_id,
                "source_cfg": f'{{"dsn":"sqlite:///{source_db_file}","table":"src_users","incremental_key":"id"}}',
                "dest_cfg": f'{{"dsn":"sqlite:///{source_db_file}","table":"dest_users"}}',
                "state_json": '{"cursor": 0}',
            },
        ).scalar_one()
        job_id = db.execute(
            text(
                "INSERT INTO sync_jobs(connection_id, status, trigger, requested_at, run_at, attempts, rows_synced) "
                "VALUES (:id, 'pending', 'manual', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 0) RETURNING id"
            ),
            {"id": connection_id},
        ).scalar_one()
        db.commit()
        yield job_id, connection_id
    finally:
        db.close()
        if os.path.exists(source_db_file):
            os.remove(source_db_file)
