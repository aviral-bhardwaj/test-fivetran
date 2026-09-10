from sqlalchemy import text

from backend.core.config import settings
from backend.core.db import SessionLocal
from workers.orchestration import worker
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
        assert row[0] == "succeeded"
    finally:
        db.close()


def test_worker_requeues_on_failure(client_with_sync_job, monkeypatch):
    def fail_run_sync_job(*args, **kwargs):
        raise RuntimeError("boom")

    monkeypatch.setattr(worker, "run_sync_job", fail_run_sync_job)

    db = SessionLocal()
    try:
        job_id = client_with_sync_job
        processed = run_once()
        assert processed is True
        row = db.execute(
            text("SELECT status, attempts, message FROM sync_jobs WHERE id = :id"),
            {"id": job_id},
        ).first()
        assert row[0] == "pending"
        assert row[1] == 1
        assert "boom" in row[2]
    finally:
        db.close()


def test_worker_marks_failed_after_max_attempts(client_with_sync_job, monkeypatch):
    def fail_run_sync_job(*args, **kwargs):
        raise RuntimeError("terminal boom")

    monkeypatch.setattr(worker, "run_sync_job", fail_run_sync_job)

    db = SessionLocal()
    try:
        job_id = client_with_sync_job
        for _ in range(settings.max_sync_attempts):
            assert run_once() is True
            db.execute(text("UPDATE sync_jobs SET run_at = CURRENT_TIMESTAMP WHERE id = :id"), {"id": job_id})
            db.commit()

        row = db.execute(
            text("SELECT status, attempts, message, started_at, finished_at, run_at FROM sync_jobs WHERE id = :id"),
            {"id": job_id},
        ).first()
        assert row[0] == "failed"
        assert row[1] == settings.max_sync_attempts
        assert "terminal boom" in row[2]
        assert row[3] is None
        assert row[4] is not None
        assert row[5] is not None
    finally:
        db.close()


def test_worker_persists_incremental_cursor(incremental_sync_job):
    db = SessionLocal()
    try:
        job_id, connection_id = incremental_sync_job
        assert run_once() is True
        job_row = db.execute(text("SELECT status FROM sync_jobs WHERE id = :id"), {"id": job_id}).first()
        state_row = db.execute(text("SELECT state_json FROM connections WHERE id = :id"), {"id": connection_id}).first()
        assert job_row[0] == "succeeded"
        assert '"cursor": 2' in state_row[0]
    finally:
        db.close()
