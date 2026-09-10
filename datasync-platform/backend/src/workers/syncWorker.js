const db = require('../db/connection');
const syncEngine = require('../services/syncEngine');
const config = require('../config');

function startWorker() {
  const handle = setInterval(async () => {
    try {
      const job = db.prepare('SELECT * FROM sync_jobs WHERE status = \'pending\' ORDER BY id ASC LIMIT 1').get();
      if (!job) return;

      db.prepare('UPDATE sync_jobs SET status = \'running\', started_at = datetime(\'now\'), attempts = attempts + 1 WHERE id = ?').run(job.id);
      
      const connection = db.prepare('SELECT * FROM connections WHERE id = ?').get(job.connection_id);
      const connector = db.prepare('SELECT * FROM connectors WHERE id = ?').get(connection.connector_id);
      const destination = db.prepare('SELECT * FROM destinations WHERE id = ?').get(connection.destination_id);

      const result = await syncEngine.runSync(job, connection, connector, destination);

      db.prepare(`
        UPDATE sync_jobs 
        SET status = 'succeeded', rows_synced = ?, bytes_synced = ?, finished_at = datetime('now'), message = ? 
        WHERE id = ?
      `).run(result.rowsSynced, result.bytesSynced, result.message, job.id);
      
      console.log(`Job ${job.id} succeeded: ${result.message}`);
    } catch (err) {
      console.error('Worker error:', err);
      // Try to update job as failed if job exists
      try {
        const job = db.prepare('SELECT id FROM sync_jobs WHERE status = \'running\' ORDER BY started_at DESC LIMIT 1').get();
        if (job) {
          db.prepare('UPDATE sync_jobs SET status = \'failed\', error_details = ?, finished_at = datetime(\'now\') WHERE id = ?').run(err.message, job.id);
        }
      } catch (e) {
        // Ignore
      }
    }
  }, config.WORKER_POLL_MS);
  
  return handle;
}

function stopWorker(handle) {
  clearInterval(handle);
}

module.exports = { startWorker, stopWorker };
