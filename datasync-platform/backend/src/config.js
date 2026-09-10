const path = require('path');

module.exports = {
  PORT: process.env.PORT || 4000,
  DB_PATH: process.env.DB_PATH || path.join(__dirname, '..', 'data', 'datasync.db'),
  DATA_DIR: process.env.DATA_DIR || path.join(__dirname, '..', 'data', 'syncs'),
  WORKER_POLL_MS: parseInt(process.env.WORKER_POLL_MS, 10) || 3000,
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};
