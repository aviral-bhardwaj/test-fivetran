from sqlalchemy.orm import Session

from backend.core.metrics import inc
from backend.core.models import Connection, SyncJob
from backend.core.registry import build_destination, build_source


def run_sync_job(db: Session, job: SyncJob) -> tuple[int, str]:
    connection = db.get(Connection, job.connection_id)
    if not connection:
        raise ValueError("Connection not found")

    source = build_source(connection.source_type, connection.source_config)
    destination = build_destination(connection.destination_type, connection.destination_config)

    state = connection.state_json or {}
    cursor = state.get("cursor")
    mode = connection.sync_mode

    rows, next_cursor = source.extract(mode=mode, cursor=cursor, batch_size=1000)
    loaded = destination.load(rows, metadata={"sync_id": job.id, "connection_id": connection.id})

    if mode == "incremental" and next_cursor is not None:
        connection.state_json = {**state, "cursor": next_cursor}
        db.add(connection)

    if loaded > 0:
        inc("rows_synced_total", loaded)

    return loaded, f"Synced {loaded} rows"


def discover_schema(db: Session, connection: Connection) -> dict:
    source = build_source(connection.source_type, connection.source_config)
    schema = source.discover_schema()
    state = connection.state_json or {}
    state["schema"] = schema
    connection.state_json = state
    db.add(connection)
    db.commit()
    db.refresh(connection)
    return schema
