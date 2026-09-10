require('./db/sqlitePatch');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config');
const errorHandler = require('./middleware/errorHandler');

const organizationsRouter = require('./routes/organizations');
const connectorsRouter = require('./routes/connectors');
const destinationsRouter = require('./routes/destinations');
const connectionsRouter = require('./routes/connections');
const syncsRouter = require('./routes/syncs');
const metricsRouter = require('./routes/metrics');
const catalogRouter = require('./routes/catalog');
const usageRouter = require('./routes/usage');
const transformationsRouter = require('./routes/transformations');

const { startWorker } = require('./workers/syncWorker');
const { startScheduler } = require('./services/schedulerService');

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/organizations', organizationsRouter);
app.use('/api/connectors', connectorsRouter);
app.use('/api/destinations', destinationsRouter);
app.use('/api/connections', connectionsRouter);
app.use('/api/syncs', syncsRouter);
app.use('/api/catalog', catalogRouter);
app.use('/api/transformations', transformationsRouter);
app.use('/api', usageRouter);
app.use('/api', metricsRouter);
app.use('/', metricsRouter);

const fs = require('fs');
const path = require('path');
const frontendDist = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(frontendDist, 'index.html'));
    }
    next();
  });
}

app.use(errorHandler);

if (require.main === module) {
  startWorker();
  startScheduler();
  app.listen(config.PORT, () => {
    console.log(`Server listening on port ${config.PORT}`);
  });
}

module.exports = app;
