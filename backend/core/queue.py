from datetime import datetime, timedelta, timezone

from sqlalchemy import select, text
from sqlalchemy.orm import Session

from backend.core.config import settings
from backend.core.models import SyncJob


def enqueue_sync(db: Session, connection_id: int, trigger: str = "manual") -> SyncJob:
    job = SyncJob(connection_id=connection_id, trigger=trigger)
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def reserve_next_job(db: Session) -> SyncJob | None:
    now = datetime.now(timezone.utc)
    if db.bind and db.bind.dialect.name == "sqlite":
        row = db.execute(
            text(
                """
                UPDATE sync_jobs
                SET status = 'running', started_at = :now
                WHERE id = (
                    SELECT id
                    FROM sync_jobs
                    WHERE status = 'pending' AND run_at <= :now
                    ORDER BY run_at ASC, id ASC
                    LIMIT 1
                )
                RETURNING id
                """
            ),
            {"now": now},
        ).first()
        if not row:
            db.rollback()
            return None
        db.commit()
        return db.get(SyncJob, row[0])

    with db.begin():
        stmt = (
            select(SyncJob)
            .where(SyncJob.status == "pending")
            .where(SyncJob.run_at <= now)
            .order_by(SyncJob.run_at.asc(), SyncJob.id.asc())
            .with_for_update(skip_locked=True)
        )
        job = db.execute(stmt).scalars().first()
        if not job:
            return None
        job.status = "running"
        job.started_at = now
        db.flush()
        job_id = job.id
    return db.get(SyncJob, job_id)


def mark_job_succeeded(db: Session, job: SyncJob, rows_synced: int, message: str = "") -> SyncJob:
    job.status = "succeeded"
    job.rows_synced = rows_synced
    job.message = message
    job.finished_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(job)
    return job


def mark_job_failed(db: Session, job: SyncJob, message: str) -> SyncJob:
    now = datetime.now(timezone.utc)
    job.attempts += 1
    if job.attempts >= settings.max_sync_attempts:
        job.status = "failed"
        job.finished_at = now
        job.started_at = None
        job.run_at = now
    else:
        backoff_seconds = settings.retry_base_delay_seconds * (2 ** (job.attempts - 1))
        job.status = "pending"
        job.run_at = now + timedelta(seconds=backoff_seconds)
        job.started_at = None
    job.message = message
    db.commit()
    db.refresh(job)
    return job
