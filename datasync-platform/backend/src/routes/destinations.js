const express = require('express');
const Joi = require('joi');
const db = require('../db/connection');
const validate = require('../middleware/validate');

const router = express.Router();

const createSchema = Joi.object({
  organization_id: Joi.number().integer().required(),
  name: Joi.string().required(),
  type: Joi.string().valid('local_file', 'sqlite_warehouse').required(),
  config: Joi.object().required()
});

const updateSchema = Joi.object({
  name: Joi.string(),
  type: Joi.string().valid('local_file', 'sqlite_warehouse'),
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

module.exports = router;
