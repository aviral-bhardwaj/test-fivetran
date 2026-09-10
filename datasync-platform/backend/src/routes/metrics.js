const express = require('express');
const db = require('../db/connection');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

router.get('/metrics', (req, res, next) => {
  try {
    const total_syncs = db.prepare('SELECT COUNT(*) as c FROM sync_jobs').get().c;
    const succeeded_syncs = db.prepare("SELECT COUNT(*) as c FROM sync_jobs WHERE status = 'succeeded'").get().c;
    const failed_syncs = db.prepare("SELECT COUNT(*) as c FROM sync_jobs WHERE status = 'failed'").get().c;
    const running_syncs = db.prepare("SELECT COUNT(*) as c FROM sync_jobs WHERE status = 'running'").get().c;
    const pending_syncs = db.prepare("SELECT COUNT(*) as c FROM sync_jobs WHERE status = 'pending'").get().c;
    const total_rows_synced = db.prepare('SELECT SUM(rows_synced) as s FROM sync_jobs').get().s || 0;
    const total_bytes_synced = db.prepare('SELECT SUM(bytes_synced) as s FROM sync_jobs').get().s || 0;
    const active_connections = db.prepare('SELECT COUNT(*) as c FROM connections WHERE enabled = 1').get().c;
    const total_connectors = db.prepare('SELECT COUNT(*) as c FROM connectors').get().c;
    const total_destinations = db.prepare('SELECT COUNT(*) as c FROM destinations').get().c;

    res.json({
      total_syncs, succeeded_syncs, failed_syncs, running_syncs, pending_syncs,
      total_rows_synced, total_bytes_synced, active_connections, total_connectors, total_destinations
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
