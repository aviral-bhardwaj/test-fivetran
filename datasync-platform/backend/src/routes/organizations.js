const express = require('express');
const Joi = require('joi');
const db = require('../db/connection');
const validate = require('../middleware/validate');

const router = express.Router();

const createSchema = Joi.object({
  name: Joi.string().min(1).max(255).required()
});

router.get('/', (req, res, next) => {
  try {
    const orgs = db.prepare('SELECT * FROM organizations').all();
    res.json(orgs);
  } catch (err) {
    next(err);
  }
});

router.post('/', validate(createSchema), (req, res, next) => {
  try {
    const result = db.prepare('INSERT INTO organizations (name) VALUES (?)').run(req.body.name);
    res.status(201).json({ id: result.lastInsertRowid, name: req.body.name });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', (req, res, next) => {
  try {
    const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(req.params.id);
    if (!org) return res.status(404).json({ error: 'Not found' });
    res.json(org);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', (req, res, next) => {
  try {
    db.prepare('DELETE FROM organizations WHERE id = ?').run(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
