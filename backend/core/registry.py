from connectors.mysql import MySQLSourceConnector
from connectors.postgres import PostgresSourceConnector
from destinations.postgres import PostgresDestinationConnector
from destinations.s3 import S3DestinationConnector
from destinations.snowflake import SnowflakeDestinationConnector


def build_source(source_type: str, config: dict):
    if source_type == "postgres":
        return PostgresSourceConnector(**config)
    if source_type == "mysql":
        return MySQLSourceConnector(**config)
    raise ValueError(f"Unsupported source type: {source_type}")


def build_destination(destination_type: str, config: dict):
    if destination_type == "postgres":
        return PostgresDestinationConnector(**config)
    if destination_type == "s3":
        return S3DestinationConnector(**config)
    if destination_type == "snowflake":
        return SnowflakeDestinationConnector(**config)
    raise ValueError(f"Unsupported destination type: {destination_type}")
