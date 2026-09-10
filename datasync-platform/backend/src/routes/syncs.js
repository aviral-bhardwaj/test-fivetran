const express = require('express');
const db = require('../db/connection');

const router = express.Router();

router.get('/', (req, res, next) => {
  try {
    const jobs = db.prepare(`
      SELECT sj.*, c.name as connection_name 
      FROM sync_jobs sj 
      JOIN connections c ON sj.connection_id = c.id 
      ORDER BY sj.id DESC LIMIT 100
    `).all();
    res.json(jobs);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', (req, res, next) => {
  try {
    const job = db.prepare('SELECT * FROM sync_jobs WHERE id = ?').get(req.params.id);
    if (!job) return res.status(404).json({ error: 'Not found' });
    res.json(job);
  } catch (err) {
    next(err);
  }
});

router.get('/:id/logs', (req, res, next) => {
  try {
    const logs = db.prepare('SELECT * FROM job_logs WHERE job_id = ? ORDER BY id ASC').all(req.params.id);
    res.json(logs);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
