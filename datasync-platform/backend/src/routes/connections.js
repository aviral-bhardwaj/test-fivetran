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
  source_table: Joi.string().required(),
  schedule_minutes: Joi.number().integer().optional(),
  schedule_interval_minutes: Joi.number().integer().optional(),
  sync_mode: Joi.string().valid('full', 'incremental').default('full'),
  incremental_key: Joi.string().allow('', null).optional()
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
    const { organization_id, name, connector_id, destination_id, source_table, schedule_minutes, schedule_interval_minutes, sync_mode, incremental_key } = req.body;
    const interval = schedule_minutes || schedule_interval_minutes || 60;
    const result = db.prepare(`
      INSERT INTO connections 
      (organization_id, name, connector_id, destination_id, source_table, schedule_minutes, sync_mode, incremental_key) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(organization_id, name, connector_id, destination_id, source_table, interval, sync_mode || 'full', incremental_key || null);
    
    res.status(201).json({ 
      id: result.lastInsertRowid, organization_id, name, connector_id, destination_id, source_table, 
      schedule_minutes: interval, schedule_interval_minutes: interval, sync_mode: sync_mode || 'full', incremental_key,
      is_active: 1, enabled: 1
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
    const { name, schedule_minutes, sync_mode, source_table, incremental_key } = req.body;
    const conn = db.prepare('SELECT * FROM connections WHERE id = ?').get(req.params.id);
    if (!conn) return res.status(404).json({ error: 'Not found' });
    
    db.prepare(`
      UPDATE connections 
      SET name = COALESCE(?, name),
          schedule_minutes = COALESCE(?, schedule_minutes),
          sync_mode = COALESCE(?, sync_mode),
          source_table = COALESCE(?, source_table),
          incremental_key = COALESCE(?, incremental_key),
          updated_at = datetime('now')
      WHERE id = ?
    `).run(name, schedule_minutes, sync_mode, source_table, incremental_key, req.params.id);
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
    
    const schema = await schemaService.discoverSchema(connection, connector);
    db.prepare('UPDATE connections SET schema_json = ? WHERE id = ?').run(JSON.stringify(schema), req.params.id);
    
    res.json(schema);
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

module.exports = router;
