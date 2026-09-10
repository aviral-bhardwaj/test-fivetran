METRICS = {
    "sync_jobs_succeeded_total": 0,
    "sync_jobs_failed_total": 0,
    "rows_synced_total": 0,
}


def inc(metric_name: str, by: int = 1):
    METRICS[metric_name] = METRICS.get(metric_name, 0) + by


def render_prometheus() -> str:
    lines = []
    for key, value in METRICS.items():
        lines.append(f"# TYPE {key} counter")
        lines.append(f"{key} {value}")
    return "\n".join(lines) + "\n"
