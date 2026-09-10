import re
from sqlalchemy import MetaData, Table, create_engine, insert

from destinations.base import DestinationConnector

TABLE_PATTERN = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)?$")


class PostgresDestinationConnector(DestinationConnector):
    def __init__(self, dsn: str, table: str):
        if not TABLE_PATTERN.match(table):
            raise ValueError("Invalid table name")
        self.engine = create_engine(dsn, future=True)
        self.table_name = table

    def load(self, rows: list[dict], metadata: dict) -> int:
        if not rows:
            return 0

        schema = None
        table_name = self.table_name
        if "." in self.table_name:
            schema, table_name = self.table_name.split(".", 1)

        meta = MetaData(schema=schema)
        table = Table(table_name, meta, autoload_with=self.engine)
        with self.engine.begin() as conn:
            conn.execute(insert(table), rows)
        return len(rows)
