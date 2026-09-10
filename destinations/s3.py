import json

import boto3

from destinations.base import DestinationConnector


class S3DestinationConnector(DestinationConnector):
    def __init__(self, bucket: str, key_prefix: str = "sync"):
        self.bucket = bucket
        self.key_prefix = key_prefix.strip("/")
        self.client = boto3.client("s3")

    def load(self, rows: list[dict], metadata: dict) -> int:
        if not rows:
            return 0
        sync_id = metadata.get("sync_id", "manual")
        key = f"{sync_id}.jsonl" if not self.key_prefix else f"{self.key_prefix}/{sync_id}.jsonl"
        payload = "\n".join(json.dumps(row, default=str) for row in rows)
        self.client.put_object(Bucket=self.bucket, Key=key, Body=payload.encode("utf-8"))
        return len(rows)
