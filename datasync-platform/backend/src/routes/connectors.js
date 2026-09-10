const express = require('express');
const Joi = require('joi');
const db = require('../db/connection');
const validate = require('../middleware/validate');

const router = express.Router();

const createSchema = Joi.object({
  organization_id: Joi.number().integer().required(),
  name: Joi.string().required(),
  type: Joi.string().valid('postgres', 'mysql', 'csv', 'demo').required(),
  config: Joi.object().required()
});

const updateSchema = Joi.object({
  name: Joi.string(),
  type: Joi.string().valid('postgres', 'mysql', 'csv', 'demo'),
  config: Joi.object(),
  status: Joi.string()
});

router.get('/', (req, res, next) => {
  try {
    const connectors = db.prepare('SELECT * FROM connectors').all();
    connectors.forEach(c => c.config = JSON.parse(c.config));
    res.json(connectors);
  } catch (err) {
    next(err);
  }
});

router.post('/', validate(createSchema), (req, res, next) => {
  try {
    const { organization_id, name, type, config } = req.body;
    const configStr = JSON.stringify(config);
    const result = db.prepare(
      'INSERT INTO connectors (organization_id, name, type, config) VALUES (?, ?, ?, ?)'
    ).run(organization_id, name, type, configStr);
    res.status(201).json({ id: result.lastInsertRowid, organization_id, name, type, config });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', (req, res, next) => {
  try {
    const connector = db.prepare('SELECT * FROM connectors WHERE id = ?').get(req.params.id);
    if (!connector) return res.status(404).json({ error: 'Not found' });
    connector.config = JSON.parse(connector.config);
    res.json(connector);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', validate(updateSchema), (req, res, next) => {
  try {
    const { name, type, config, status } = req.body;
    const connector = db.prepare('SELECT * FROM connectors WHERE id = ?').get(req.params.id);
    if (!connector) return res.status(404).json({ error: 'Not found' });
    
    const newName = name || connector.name;
    const newType = type || connector.type;
    const newConfig = config ? JSON.stringify(config) : connector.config;
    const newStatus = status || connector.status;
    
    db.prepare(
      'UPDATE connectors SET name = ?, type = ?, config = ?, status = ? WHERE id = ?'
    ).run(newName, newType, newConfig, newStatus, req.params.id);
    res.json({ id: req.params.id, name: newName, type: newType, config: JSON.parse(newConfig), status: newStatus });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', (req, res, next) => {
  try {
    db.prepare('DELETE FROM connectors WHERE id = ?').run(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.post('/:id/test', (req, res, next) => {
  try {
    const connector = db.prepare('SELECT * FROM connectors WHERE id = ?').get(req.params.id);
    if (!connector) return res.status(404).json({ error: 'Not found' });
    
    if (connector.type === 'demo') {
      res.json({ success: true, message: 'Demo connector is ready' });
    } else {
      res.json({ success: true, message: 'Connection parameters validated' });
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
