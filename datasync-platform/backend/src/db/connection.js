require('./sqlitePatch');
const Database = require('better-sqlite3');
const config = require('../config');
const fs = require('fs');
const path = require('path');

const dbDir = path.dirname(config.DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(config.DB_PATH);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS organizations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS connectors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organization_id INTEGER NOT NULL REFERENCES organizations(id),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    config TEXT NOT NULL DEFAULT '{}',
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS destinations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organization_id INTEGER NOT NULL REFERENCES organizations(id),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    config TEXT NOT NULL DEFAULT '{}',
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS connections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organization_id INTEGER NOT NULL REFERENCES organizations(id),
    name TEXT NOT NULL,
    connector_id INTEGER NOT NULL REFERENCES connectors(id),
    destination_id INTEGER NOT NULL REFERENCES destinations(id),
    schedule_minutes INTEGER DEFAULT 60,
    sync_mode TEXT DEFAULT 'full',
    source_table TEXT NOT NULL,
    incremental_key TEXT,
    cursor_value TEXT,
    schema_json TEXT,
    enabled INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sync_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    connection_id INTEGER NOT NULL REFERENCES connections(id),
    status TEXT DEFAULT 'pending',
    trigger_type TEXT DEFAULT 'manual',
    rows_synced INTEGER DEFAULT 0,
    bytes_synced INTEGER DEFAULT 0,
    stream_stats TEXT DEFAULT '{}',
    message TEXT,
    error_details TEXT,
    attempts INTEGER DEFAULT 0,
    started_at TEXT,
    finished_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS job_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL REFERENCES sync_jobs(id) ON DELETE CASCADE,
    timestamp TEXT DEFAULT (datetime('now')),
    level TEXT DEFAULT 'INFO',
    message TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_job_logs_job_id ON job_logs(job_id);
`);

// Safe migrations for new columns
const connCols = db.prepare('PRAGMA table_info(connections)').all().map(c => c.name);
if (!connCols.includes('sync_catalog')) {
  try { db.prepare("ALTER TABLE connections ADD COLUMN sync_catalog TEXT DEFAULT '[]'").run(); } catch (e) {}
}
if (!connCols.includes('prefix')) {
  try { db.prepare("ALTER TABLE connections ADD COLUMN prefix TEXT DEFAULT 'airbyte_raw_'").run(); } catch (e) {}
}

const jobCols = db.prepare('PRAGMA table_info(sync_jobs)').all().map(c => c.name);
if (!jobCols.includes('stream_stats')) {
  try { db.prepare("ALTER TABLE sync_jobs ADD COLUMN stream_stats TEXT DEFAULT '{}'").run(); } catch (e) {}
}

const orgCount = db.prepare('SELECT COUNT(*) as count FROM organizations').get();
if (orgCount.count === 0) {
  db.prepare('INSERT INTO organizations (name) VALUES (?)').run('Default Organization');
}

module.exports = db;
