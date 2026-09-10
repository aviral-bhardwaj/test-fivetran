from sqlalchemy import create_engine, text

from backend.core.db import SessionLocal
from workers.orchestration.worker import run_once


def test_worker_no_jobs_returns_false():
    assert run_once() is False


def test_worker_processes_sync_job(client_with_sync_job):
    db = SessionLocal()
    try:
        job_id = client_with_sync_job
        processed = run_once()
        assert processed is True
        row = db.execute(text("SELECT status FROM sync_jobs WHERE id = :id"), {"id": job_id}).first()
        assert row[0] in {"succeeded", "pending", "failed"}
    finally:
        db.close()
