const cron = require('node-cron');
const db = require('../db/connection');

function startScheduler() {
  const task = cron.schedule('* * * * *', () => {
    try {
      const connections = db.prepare('SELECT * FROM connections WHERE enabled = 1').all();
      
      for (const conn of connections) {
        if (!conn.schedule_minutes) continue;

        const latestJob = db.prepare('SELECT * FROM sync_jobs WHERE connection_id = ? ORDER BY id DESC LIMIT 1').get(conn.id);
        const hasActiveJob = db.prepare('SELECT COUNT(*) as c FROM sync_jobs WHERE connection_id = ? AND status IN (\'pending\', \'running\')').get(conn.id).c > 0;
        
        if (hasActiveJob) continue;

        let shouldRun = false;
        if (!latestJob) {
          shouldRun = true;
        } else {
          const createdAt = new Date(latestJob.created_at + 'Z').getTime();
          const now = Date.now();
          const diffMinutes = (now - createdAt) / 60000;
          if (diffMinutes >= conn.schedule_minutes) {
            shouldRun = true;
          }
        }

        if (shouldRun) {
          db.prepare('INSERT INTO sync_jobs (connection_id, status, trigger_type) VALUES (?, \'pending\', \'scheduled\')').run(conn.id);
          console.log(`Scheduled sync for connection ${conn.id}`);
        }
      }
    } catch (err) {
      console.error('Scheduler error:', err);
    }
  });
  
  return task;
}

module.exports = { startScheduler };
