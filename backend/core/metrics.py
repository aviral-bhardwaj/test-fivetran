from threading import Lock

METRICS = {
    "sync_jobs_succeeded_total": 0,
    "sync_jobs_failed_total": 0,
    "rows_synced_total": 0,
}
_METRICS_LOCK = Lock()


def inc(metric_name: str, by: int = 1):
    with _METRICS_LOCK:
        METRICS[metric_name] = METRICS.get(metric_name, 0) + by


def render_prometheus() -> str:
    lines = []
    with _METRICS_LOCK:
        items = list(METRICS.items())
    for key, value in items:
        lines.append(f"# TYPE {key} counter")
        lines.append(f"{key} {value}")
    return "\n".join(lines) + "\n"
