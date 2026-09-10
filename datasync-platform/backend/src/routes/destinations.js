const express = require('express');
const Joi = require('joi');
const db = require('../db/connection');
const validate = require('../middleware/validate');

const router = express.Router();

const createSchema = Joi.object({
  organization_id: Joi.number().integer().required(),
  name: Joi.string().required(),
  type: Joi.string().required(),
  config: Joi.object().required()
});

const updateSchema = Joi.object({
  name: Joi.string(),
  type: Joi.string(),
  config: Joi.object(),
  status: Joi.string()
});

router.get('/', (req, res, next) => {
  try {
    const destinations = db.prepare('SELECT * FROM destinations').all();
    destinations.forEach(d => d.config = JSON.parse(d.config));
    res.json(destinations);
  } catch (err) {
    next(err);
  }
});

router.post('/', validate(createSchema), (req, res, next) => {
  try {
    const { organization_id, name, type, config } = req.body;
    const configStr = JSON.stringify(config);
    const result = db.prepare(
      'INSERT INTO destinations (organization_id, name, type, config) VALUES (?, ?, ?, ?)'
    ).run(organization_id, name, type, configStr);
    res.status(201).json({ id: result.lastInsertRowid, organization_id, name, type, config });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', (req, res, next) => {
  try {
    const dest = db.prepare('SELECT * FROM destinations WHERE id = ?').get(req.params.id);
    if (!dest) return res.status(404).json({ error: 'Not found' });
    dest.config = JSON.parse(dest.config);
    res.json(dest);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', validate(updateSchema), (req, res, next) => {
  try {
    const { name, type, config, status } = req.body;
    const dest = db.prepare('SELECT * FROM destinations WHERE id = ?').get(req.params.id);
    if (!dest) return res.status(404).json({ error: 'Not found' });
    
    const newName = name || dest.name;
    const newType = type || dest.type;
    const newConfig = config ? JSON.stringify(config) : dest.config;
    const newStatus = status || dest.status;
    
    db.prepare(
      'UPDATE destinations SET name = ?, type = ?, config = ?, status = ? WHERE id = ?'
    ).run(newName, newType, newConfig, newStatus, req.params.id);
    res.json({ id: req.params.id, name: newName, type: newType, config: JSON.parse(newConfig), status: newStatus });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', (req, res, next) => {
  try {
    db.prepare('DELETE FROM destinations WHERE id = ?').run(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// List all actual tables in this destination warehouse
router.get('/:id/tables', (req, res, next) => {
  try {
    const Database = require('better-sqlite3');
    const fs = require('fs');
    const path = require('path');

    const dest = db.prepare('SELECT * FROM destinations WHERE id = ?').get(req.params.id);
    if (!dest) return res.status(404).json({ error: 'Destination not found' });

    const config = JSON.parse(dest.config || '{}');

    if (dest.type === 'sqlite_warehouse' || dest.type === 'duckdb' || dest.type === 'snowflake' || dest.type === 'bigquery' || dest.type === 'postgres') {
      const whPath = path.resolve(config.dbPath || './data/warehouse.db');
      if (!fs.existsSync(whPath)) {
        return res.json({ destination: dest.name, tables: [] });
      }

      const wh = new Database(whPath);
      const tableNames = wh.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);

      const tables = tableNames.map(name => {
        try {
          const count = wh.prepare(`SELECT COUNT(*) as c FROM "${name}"`).get().c;
          const cols = wh.prepare(`PRAGMA table_info("${name}")`).all().map(c => ({ name: c.name, type: c.type }));
          return { name, row_count: count, columns: cols };
        } catch {
          return { name, row_count: 0, columns: [] };
        }
      });

      return res.json({ destination: dest.name, db_path: whPath, tables });
    }

    // Local file destination
    const outDir = path.resolve(config.outputDir || './data/syncs');
    if (!fs.existsSync(outDir)) {
      return res.json({ destination: dest.name, tables: [] });
    }

    const files = fs.readdirSync(outDir).filter(f => f.endsWith('.jsonl'));
    const tables = files.map(file => {
      try {
        const content = fs.readFileSync(path.join(outDir, file), 'utf-8').trim();
        const lines = content ? content.split('\n').length : 0;
        return { name: file, row_count: lines, file_path: path.join(outDir, file) };
      } catch {
        return { name: file, row_count: 0 };
      }
    });

    res.json({ destination: dest.name, output_dir: outDir, tables });
  } catch (err) {
    next(err);
  }
});

// Fetch table data or query destination warehouse
router.get('/:id/tables/:table/data', (req, res, next) => {
  try {
    const Database = require('better-sqlite3');
    const fs = require('fs');
    const path = require('path');

    const dest = db.prepare('SELECT * FROM destinations WHERE id = ?').get(req.params.id);
    if (!dest) return res.status(404).json({ error: 'Destination not found' });

    const config = JSON.parse(dest.config || '{}');
    const tableName = req.params.table;

    if (dest.type === 'sqlite_warehouse' || dest.type === 'duckdb' || dest.type === 'snowflake' || dest.type === 'bigquery' || dest.type === 'postgres') {
      const whPath = path.resolve(config.dbPath || './data/warehouse.db');
      if (!fs.existsSync(whPath)) return res.json({ table: tableName, rows: [], total: 0 });

      const wh = new Database(whPath);
      const total = wh.prepare(`SELECT COUNT(*) as c FROM "${tableName}"`).get().c;
      const rows = wh.prepare(`SELECT * FROM "${tableName}" LIMIT 100`).all();
      return res.json({ table: tableName, total, rows });
    }

    // Local file
    const outDir = path.resolve(config.outputDir || './data/syncs');
    const filePath = path.join(outDir, tableName);
    if (!fs.existsSync(filePath)) return res.json({ table: tableName, rows: [], total: 0 });

    const content = fs.readFileSync(filePath, 'utf-8').trim();
    const rows = content ? content.split('\n').map(l => JSON.parse(l)) : [];
    res.json({ table: tableName, total: rows.length, rows: rows.slice(0, 100) });
  } catch (err) {
    next(err);
  }
});

// Run analytical SQL query against destination warehouse
router.post('/:id/query', (req, res, next) => {
  try {
    const Database = require('better-sqlite3');
    const fs = require('fs');
    const path = require('path');

    const dest = db.prepare('SELECT * FROM destinations WHERE id = ?').get(req.params.id);
    if (!dest) return res.status(404).json({ error: 'Destination not found' });

    const { sql } = req.body;
    if (!sql || typeof sql !== 'string') {
      return res.status(400).json({ error: 'SQL query string required' });
    }

    const config = JSON.parse(dest.config || '{}');
    const whPath = path.resolve(config.dbPath || './data/warehouse.db');
    if (!fs.existsSync(whPath)) {
      return res.status(400).json({ error: 'Warehouse database has not been initialized yet. Run a sync first.' });
    }

    const wh = new Database(whPath);
    const results = wh.prepare(sql).all();
    res.json({ sql, rows_count: results.length, rows: results });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
