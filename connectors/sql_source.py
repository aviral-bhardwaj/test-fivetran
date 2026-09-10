import re
from sqlalchemy import create_engine, inspect, text

from connectors.base import SourceConnector

TABLE_PATTERN = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)?$")
COLUMN_PATTERN = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")


class SQLSourceConnector(SourceConnector):
    def __init__(self, dsn: str, table: str, incremental_key: str | None = None):
        if not TABLE_PATTERN.match(table):
            raise ValueError("Invalid table name")
        if incremental_key and not COLUMN_PATTERN.match(incremental_key):
            raise ValueError("Invalid incremental key")
        self.dsn = dsn
        self.table = table
        self.incremental_key = incremental_key
        self.engine = create_engine(dsn, future=True)

    def discover_schema(self) -> dict:
        parts = self.table.split(".")
        schema = None
        table = self.table
        if len(parts) == 2:
            schema, table = parts
        inspector = inspect(self.engine)
        cols = inspector.get_columns(table, schema=schema)
        return {"table": self.table, "columns": [{"name": c["name"], "type": str(c["type"])} for c in cols]}

    def extract(self, mode: str, cursor: str | int | float | None, batch_size: int) -> tuple[list[dict], str | int | float | None]:
        if mode == "incremental" and not self.incremental_key:
            raise ValueError("incremental_key is required for incremental sync")

        if mode == "incremental" and cursor is not None:
            stmt = text(
                f"SELECT * FROM {self.table} WHERE {self.incremental_key} > :cursor ORDER BY {self.incremental_key} ASC LIMIT :limit"
            )
            params = {"cursor": cursor, "limit": batch_size}
        elif mode == "incremental":
            stmt = text(f"SELECT * FROM {self.table} ORDER BY {self.incremental_key} ASC LIMIT :limit")
            params = {"limit": batch_size}
        else:
            stmt = text(f"SELECT * FROM {self.table} LIMIT :limit")
            params = {"limit": batch_size}

        with self.engine.connect() as conn:
            rows = [dict(r._mapping) for r in conn.execute(stmt, params)]

        next_cursor = None
        if rows and self.incremental_key:
            next_cursor = rows[-1].get(self.incremental_key)

        return rows, next_cursor
