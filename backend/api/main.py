from fastapi import Depends, FastAPI, HTTPException
from fastapi.responses import PlainTextResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.api.schemas import ConnectionCreate, ConnectionOut, OrganizationCreate, OrganizationOut, SyncOut
from backend.core.db import Base, engine, get_db
from backend.core.metrics import render_prometheus
from backend.core.models import Connection, Organization, SyncJob
from backend.core.queue import enqueue_sync
from backend.core.sync_engine import discover_schema

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Data Platform Control Plane", version="0.1.0")


@app.get("/healthz")
def healthz():
    return {"status": "ok"}


@app.get("/metrics", response_class=PlainTextResponse)
def metrics():
    return render_prometheus()


@app.post("/organizations", response_model=OrganizationOut)
def create_organization(payload: OrganizationCreate, db: Session = Depends(get_db)):
    org = Organization(name=payload.name)
    db.add(org)
    db.commit()
    db.refresh(org)
    return org


@app.post("/connections", response_model=ConnectionOut)
def create_connection(payload: ConnectionCreate, db: Session = Depends(get_db)):
    org = db.get(Organization, payload.organization_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    conn = Connection(**payload.model_dump())
    db.add(conn)
    db.commit()
    db.refresh(conn)
    return conn


@app.post("/connections/{connection_id}/discover-schema")
def run_schema_discovery(connection_id: int, db: Session = Depends(get_db)):
    conn = db.get(Connection, connection_id)
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")

    schema = discover_schema(db, conn)
    return {"connection_id": connection_id, "schema": schema}


@app.post("/connections/{connection_id}/syncs", response_model=SyncOut)
def trigger_sync(connection_id: int, db: Session = Depends(get_db)):
    conn = db.get(Connection, connection_id)
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")

    job = enqueue_sync(db, connection_id=connection_id)
    return job


@app.get("/syncs/{sync_id}", response_model=SyncOut)
def get_sync(sync_id: int, db: Session = Depends(get_db)):
    job = db.get(SyncJob, sync_id)
    if not job:
        raise HTTPException(status_code=404, detail="Sync not found")
    return job


@app.get("/connections/{connection_id}/syncs", response_model=list[SyncOut])
def list_connection_syncs(connection_id: int, db: Session = Depends(get_db)):
    stmt = select(SyncJob).where(SyncJob.connection_id == connection_id).order_by(SyncJob.id.desc())
    return list(db.execute(stmt).scalars().all())
