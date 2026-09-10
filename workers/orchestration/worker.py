import logging
import time

from backend.core.config import settings
from backend.core.db import SessionLocal
from backend.core.metrics import inc
from backend.core.models import Connection
from backend.core.queue import mark_job_failed, mark_job_succeeded, reserve_next_job
from backend.core.sync_engine import run_sync_job

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("worker")


def run_once() -> bool:
    db = SessionLocal()
    try:
        job = reserve_next_job(db)
        if not job:
            return False

        try:
            rows, message, next_state = run_sync_job(db, job)
            if next_state is not None:
                connection = db.get(Connection, job.connection_id)
                if connection:
                    connection.state_json = {**(connection.state_json or {}), **next_state}
                    db.add(connection)
            mark_job_succeeded(db, job, rows_synced=rows, message=message)
            inc("sync_jobs_succeeded_total")
            logger.info("Sync %s succeeded (%s rows)", job.id, rows)
        except Exception as exc:  # noqa: BLE001
            mark_job_failed(db, job, message=str(exc))
            inc("sync_jobs_failed_total")
            logger.exception("Sync %s failed", job.id)
        return True
    finally:
        db.close()


def run_forever():
    logger.info("Worker started")
    while True:
        had_job = run_once()
        if not had_job:
            time.sleep(settings.worker_poll_seconds)


if __name__ == "__main__":
    run_forever()
