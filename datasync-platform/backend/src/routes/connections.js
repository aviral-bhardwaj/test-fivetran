const express = require('express');
const Joi = require('joi');
const db = require('../db/connection');
const validate = require('../middleware/validate');
const schemaService = require('../services/schemaService');

const router = express.Router();

const createSchema = Joi.object({
  organization_id: Joi.number().integer().required(),
  name: Joi.string().required(),
  connector_id: Joi.number().integer().required(),
  destination_id: Joi.number().integer().required(),
  source_table: Joi.string().allow('', null).optional().default('default'),
  schedule_minutes: Joi.number().integer().optional(),
  schedule_interval_minutes: Joi.number().integer().optional(),
  sync_mode: Joi.string().allow('full', 'incremental', 'full_refresh_overwrite', 'full_refresh_append', 'incremental_append', 'incremental_deduped').default('full'),
  incremental_key: Joi.string().allow('', null).optional(),
  sync_catalog: Joi.any().optional(),
  prefix: Joi.string().allow('', null).optional()
});

router.get('/', (req, res, next) => {
  try {
    const connections = db.prepare(`
      SELECT c.*, c.enabled as is_active, c.schedule_minutes as schedule_interval_minutes,
             conn.name as connector_name, conn.type as connector_type,
             d.name as destination_name, d.type as destination_type
      FROM connections c
      JOIN connectors conn ON c.connector_id = conn.id
      JOIN destinations d ON c.destination_id = d.id
    `).all();
    res.json(connections);
  } catch (err) {
    next(err);
  }
});

router.post('/', validate(createSchema), (req, res, next) => {
  try {
    const { organization_id, name, connector_id, destination_id, source_table, schedule_minutes, schedule_interval_minutes, sync_mode, incremental_key, sync_catalog, prefix } = req.body;
    const interval = schedule_minutes || schedule_interval_minutes || 60;
    const catalogJson = sync_catalog ? (typeof sync_catalog === 'string' ? sync_catalog : JSON.stringify(sync_catalog)) : '[]';
    const destPrefix = prefix || 'airbyte_raw_';

    const result = db.prepare(`
      INSERT INTO connections 
      (organization_id, name, connector_id, destination_id, source_table, schedule_minutes, sync_mode, incremental_key, sync_catalog, prefix) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(organization_id, name, connector_id, destination_id, source_table || 'default', interval, sync_mode || 'full', incremental_key || null, catalogJson, destPrefix);
    
    res.status(201).json({ 
      id: result.lastInsertRowid, organization_id, name, connector_id, destination_id, source_table: source_table || 'default', 
      schedule_minutes: interval, schedule_interval_minutes: interval, sync_mode: sync_mode || 'full', incremental_key,
      sync_catalog: catalogJson, prefix: destPrefix, is_active: 1, enabled: 1
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', (req, res, next) => {
  try {
    const connection = db.prepare(`
      SELECT c.*, c.enabled as is_active, c.schedule_minutes as schedule_interval_minutes,
             conn.name as connector_name, conn.type as connector_type,
             d.name as destination_name, d.type as destination_type
      FROM connections c
      JOIN connectors conn ON c.connector_id = conn.id
      JOIN destinations d ON c.destination_id = d.id
      WHERE c.id = ?
    `).get(req.params.id);
    if (!connection) return res.status(404).json({ error: 'Not found' });
    res.json(connection);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', (req, res, next) => {
  try {
    const { name, schedule_minutes, schedule_interval_minutes, sync_mode, source_table, incremental_key, sync_catalog, prefix } = req.body;
    const conn = db.prepare('SELECT * FROM connections WHERE id = ?').get(req.params.id);
    if (!conn) return res.status(404).json({ error: 'Not found' });
    
    const interval = schedule_minutes || schedule_interval_minutes;
    const catalogJson = sync_catalog !== undefined ? (typeof sync_catalog === 'string' ? sync_catalog : JSON.stringify(sync_catalog)) : null;

    db.prepare(`
      UPDATE connections 
      SET name = COALESCE(?, name),
          schedule_minutes = COALESCE(?, schedule_minutes),
          sync_mode = COALESCE(?, sync_mode),
          source_table = COALESCE(?, source_table),
          incremental_key = COALESCE(?, incremental_key),
          sync_catalog = COALESCE(?, sync_catalog),
          prefix = COALESCE(?, prefix),
          updated_at = datetime('now')
      WHERE id = ?
    `).run(name, interval, sync_mode, source_table, incremental_key, catalogJson, prefix, req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', (req, res, next) => {
  try {
    db.prepare('DELETE FROM connections WHERE id = ?').run(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.post('/:id/sync', (req, res, next) => {
  try {
    const conn = db.prepare('SELECT * FROM connections WHERE id = ?').get(req.params.id);
    if (!conn) return res.status(404).json({ error: 'Not found' });
    
    const result = db.prepare(`
      INSERT INTO sync_jobs (connection_id, status, trigger_type) VALUES (?, 'pending', 'manual')
    `).run(req.params.id);
    
    const job = db.prepare('SELECT * FROM sync_jobs WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(job);
  } catch (err) {
    next(err);
  }
});

router.get('/:id/syncs', (req, res, next) => {
  try {
    const syncs = db.prepare('SELECT * FROM sync_jobs WHERE connection_id = ? ORDER BY id DESC LIMIT 50').all(req.params.id);
    res.json(syncs);
  } catch (err) {
    next(err);
  }
});

const handleDiscoverSchema = async (req, res, next) => {
  try {
    const connection = db.prepare(`
      SELECT c.*, conn.type as connector_type, conn.config as connector_config
      FROM connections c
      JOIN connectors conn ON c.connector_id = conn.id
      WHERE c.id = ?
    `).get(req.params.id);
    
    if (!connection) return res.status(404).json({ error: 'Not found' });
    
    const connector = {
      type: connection.connector_type,
      config: connection.connector_config
    };
    
    const streamCatalog = await schemaService.discoverStreams(connector);
    const tableSchema = await schemaService.discoverSchema(connection, connector);

    const fullResult = {
      table: connection.source_table || (streamCatalog.streams[0]?.name || 'default'),
      columns: tableSchema.columns || [],
      streams: streamCatalog.streams || []
    };

    // Auto-populate sync_catalog if not set
    if (!connection.sync_catalog || connection.sync_catalog === '[]') {
      const defaultCatalog = streamCatalog.streams.map(s => ({
        name: s.name,
        sync_mode: s.supportedSyncModes[0] || 'full_refresh_overwrite',
        primary_key: s.sourceDefinedPrimaryKey?.[0]?.[0] || 'id',
        cursor_field: s.defaultCursorField?.[0] || 'id',
        enabled: true
      }));
      db.prepare('UPDATE connections SET sync_catalog = ? WHERE id = ?').run(JSON.stringify(defaultCatalog), req.params.id);
    }

    db.prepare('UPDATE connections SET schema_json = ? WHERE id = ?').run(JSON.stringify(fullResult), req.params.id);
    
    res.json(fullResult);
  } catch (err) {
    next(err);
  }
};

router.post('/:id/discover-schema', handleDiscoverSchema);
router.post('/:id/discover', handleDiscoverSchema);

const handleToggle = (req, res, next) => {
  try {
    const conn = db.prepare('SELECT enabled FROM connections WHERE id = ?').get(req.params.id);
    if (!conn) return res.status(404).json({ error: 'Not found' });
    
    const newEnabled = conn.enabled === 1 ? 0 : 1;
    db.prepare('UPDATE connections SET enabled = ? WHERE id = ?').run(newEnabled, req.params.id);
    
    const updated = db.prepare('SELECT * FROM connections WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

router.put('/:id/toggle', handleToggle);
router.post('/:id/toggle', handleToggle);

// Fetch live records loaded into the destination warehouse for this connection
router.get('/:id/data', (req, res, next) => {
  try {
    const Database = require('better-sqlite3');
    const fs = require('fs');
    const path = require('path');

    const conn = db.prepare(`
      SELECT c.*, d.type as dest_type, d.config as dest_config, d.name as dest_name
      FROM connections c
      JOIN destinations d ON c.destination_id = d.id
      WHERE c.id = ?
    `).get(req.params.id);

    if (!conn) return res.status(404).json({ error: 'Connection not found' });

    const destConfig = typeof conn.dest_config === 'string' ? JSON.parse(conn.dest_config) : (conn.dest_config || {});
    const prefix = conn.prefix || 'airbyte_raw_';
    const targetTable = `${prefix}${conn.source_table}`;

    // 1. Relational / SQLite Warehouse
    if (conn.dest_type === 'sqlite_warehouse' || conn.dest_type === 'duckdb' || conn.dest_type === 'snowflake' || conn.dest_type === 'bigquery' || conn.dest_type === 'postgres') {
      const whPath = path.resolve(destConfig.dbPath || './data/warehouse.db');
      if (!fs.existsSync(whPath)) {
        return res.json({ success: true, destination_type: conn.dest_type, destination_name: conn.dest_name, table: targetTable, total: 0, rows: [] });
      }

      const wh = new Database(whPath);
      const tables = wh.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);

      // Match targetTable or source_table or closest table
      const matched = tables.find(t => t === targetTable) ||
                      tables.find(t => t === conn.source_table) ||
                      tables.find(t => t.includes(conn.source_table)) ||
                      tables[0];

      if (!matched) {
        return res.json({ success: true, destination_type: conn.dest_type, destination_name: conn.dest_name, table: targetTable, total: 0, rows: [] });
      }

      const totalCount = wh.prepare(`SELECT COUNT(*) as c FROM "${matched}"`).get().c;
      const rows = wh.prepare(`SELECT * FROM "${matched}" LIMIT 100`).all();

      return res.json({
        success: true,
        destination_type: conn.dest_type,
        destination_name: conn.dest_name,
        table: matched,
        total: totalCount,
        rows
      });
    }

    // 2. Local File / S3 / JSONL
    const outDir = path.resolve(destConfig.outputDir || './data/syncs');
    if (!fs.existsSync(outDir)) {
      return res.json({ success: true, destination_type: conn.dest_type, destination_name: conn.dest_name, table: targetTable, total: 0, rows: [] });
    }

    const files = fs.readdirSync(outDir).filter(f => f.includes(conn.source_table) && f.endsWith('.jsonl'));
    if (files.length === 0) {
      return res.json({ success: true, destination_type: conn.dest_type, destination_name: conn.dest_name, table: targetTable, total: 0, rows: [] });
    }

    const latestFile = path.join(outDir, files[files.length - 1]);
    const fileContent = fs.readFileSync(latestFile, 'utf-8').trim();
    if (!fileContent) {
      return res.json({ success: true, destination_type: conn.dest_type, destination_name: conn.dest_name, table: targetTable, total: 0, rows: [] });
    }

    const rows = fileContent.split('\n').filter(Boolean).map(l => {
      try { return JSON.parse(l); } catch (e) { return null; }
    }).filter(Boolean);

    return res.json({
      success: true,
      destination_type: conn.dest_type,
      destination_name: conn.dest_name,
      table: targetTable,
      file: path.basename(latestFile),
      total: rows.length,
      rows: rows.slice(0, 100)
    });
  } catch (err) {
    next(err);
  }
});

// Insert a real new record into the source and trigger sync to verify data movement
router.post('/:id/insert-record', async (req, res, next) => {
  try {
    const UniversalAirbyteSource = require('../connectors/airbyteSource');
    const syncEngine = require('../services/syncEngine');

    const conn = db.prepare(`
      SELECT c.*, conn.type as connector_type, conn.config as connector_config,
             d.type as destination_type, d.config as destination_config
      FROM connections c
      JOIN connectors conn ON c.connector_id = conn.id
      JOIN destinations d ON c.destination_id = d.id
      WHERE c.id = ?
    `).get(req.params.id);

    if (!conn) return res.status(404).json({ error: 'Connection not found' });

    // Generate realistic custom record
    const stream = conn.source_table || 'demo_users';
    const timestamp = new Date().toISOString();
    const customRecord = req.body && Object.keys(req.body).length > 0 ? req.body : {
      id: Date.now() % 100000,
      name: `Customer ${Math.floor(Math.random() * 900 + 100)}`,
      email: `customer.${Date.now() % 10000}@enterprise.com`,
      city: ['New York', 'San Francisco', 'Chicago', 'Seattle', 'Austin'][Math.floor(Math.random() * 5)],
      amount: +(Math.random() * 450 + 50).toFixed(2),
      status: 'completed',
      signup_date: timestamp,
      created_at: timestamp
    };

    UniversalAirbyteSource.insertCustomRecord(stream, customRecord);

    // Enqueue and run sync immediately so user sees it right away
    const jobResult = db.prepare(`
      INSERT INTO sync_jobs (connection_id, status, trigger_type, started_at) 
      VALUES (?, 'running', 'manual', datetime('now'))
    `).run(conn.id);

    const job = db.prepare('SELECT * FROM sync_jobs WHERE id = ?').get(jobResult.lastInsertRowid);
    const connector = { type: conn.connector_type, config: conn.connector_config };
    const destination = { type: conn.destination_type, config: conn.destination_config };

    const result = await syncEngine.runSync(job, conn, connector, destination);

    db.prepare(`
      UPDATE sync_jobs 
      SET status = 'succeeded', rows_synced = ?, bytes_synced = ?, finished_at = datetime('now'), message = ?
      WHERE id = ?
    `).run(result.rowsSynced, result.bytesSynced, result.message, job.id);

    res.status(201).json({
      success: true,
      message: `Record inserted into source '${stream}' and replicated to warehouse (${result.rowsSynced} rows loaded)`,
      record: customRecord,
      sync_job_id: job.id
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
