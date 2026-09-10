from datetime import datetime, timedelta, timezone

from sqlalchemy import select
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
    stmt = (
        select(SyncJob)
        .where(SyncJob.status == "pending")
        .where(SyncJob.run_at <= datetime.now(timezone.utc))
        .order_by(SyncJob.run_at.asc(), SyncJob.id.asc())
    )
    job = db.execute(stmt).scalars().first()
    if not job:
        return None

    job.status = "running"
    job.started_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(job)
    return job


def mark_job_succeeded(db: Session, job: SyncJob, rows_synced: int, message: str = "") -> SyncJob:
    job.status = "succeeded"
    job.rows_synced = rows_synced
    job.message = message
    job.finished_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(job)
    return job


def mark_job_failed(db: Session, job: SyncJob, message: str) -> SyncJob:
    job.attempts += 1
    if job.attempts >= settings.max_sync_attempts:
        job.status = "failed"
        job.finished_at = datetime.now(timezone.utc)
    else:
        backoff_minutes = 2 ** job.attempts
        job.status = "pending"
        job.run_at = datetime.now(timezone.utc) + timedelta(minutes=backoff_minutes)
    job.message = message
    db.commit()
    db.refresh(job)
    return job
