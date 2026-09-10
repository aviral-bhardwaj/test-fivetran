from dataclasses import dataclass


@dataclass
class SyncResult:
    rows_synced: int
    next_cursor: str | int | float | None
    message: str = ""
