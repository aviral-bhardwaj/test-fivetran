# Data Platform MVP

This repository now includes an MVP implementation of the control/data plane architecture described in `README.md`.

## Included

- FastAPI control plane (`backend/api/main.py`)
- SQLAlchemy metadata models (`backend/core/models.py`)
- Queue + worker orchestration (`backend/core/queue.py`, `workers/orchestration/worker.py`)
- Source connectors: PostgreSQL/MySQL style SQL extraction (`connectors/`)
- Destination connectors: PostgreSQL, S3, Snowflake (`destinations/`)
- Schema discovery + full/incremental sync state management (`backend/core/sync_engine.py`)
- Metrics endpoint (`/metrics`)

## Run locally

```bash
pip install -r requirements.txt
uvicorn backend.api.main:app --reload
python -m workers.orchestration.worker
```

Or use Docker Compose:

```bash
docker compose -f infrastructure/docker-compose.yml up
```
