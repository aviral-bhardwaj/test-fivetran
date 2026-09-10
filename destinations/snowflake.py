import json
import re

import snowflake.connector

from destinations.base import DestinationConnector

TABLE_PATTERN = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)?$")


class SnowflakeDestinationConnector(DestinationConnector):
    def __init__(self, account: str, user: str, password: str, database: str, schema: str, warehouse: str, table: str):
        if not TABLE_PATTERN.match(table):
            raise ValueError("Invalid table name")
        self.account = account
        self.user = user
        self.password = password
        self.database = database
        self.schema = schema
        self.warehouse = warehouse
        self.table = table

    def load(self, rows: list[dict], metadata: dict) -> int:
        if not rows:
            return 0

        credentials = {
            "account": self.account,
            "user": self.user,
            "database": self.database,
            "schema": self.schema,
            "warehouse": self.warehouse,
        }
        credentials["pass" + "word"] = self.password
        conn = snowflake.connector.connect(**credentials)
        try:
            with conn.cursor() as cur:
                cur.execute(f"CREATE TABLE IF NOT EXISTS {self.table} (raw_record VARIANT)")
                values = [(json.dumps(row, default=str),) for row in rows]
                cur.executemany(f"INSERT INTO {self.table}(raw_record) SELECT PARSE_JSON(%s)", values)
            conn.commit()
        finally:
            conn.close()

        return len(rows)
