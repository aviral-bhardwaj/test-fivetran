const UniversalAirbyteSource = require('../connectors/airbyteSource');
const UniversalAirbyteDestination = require('../destinations/airbyteDestination');
const db = require('../db/connection');

function buildConnector(type, config) {
  return new UniversalAirbyteSource(type, config);
}

function buildDestination(type, config) {
  return new UniversalAirbyteDestination(type, config);
}

function logJob(jobId, level, message) {
  try {
    db.prepare('INSERT INTO job_logs (job_id, level, message) VALUES (?, ?, ?)').run(jobId, level.toUpperCase(), message);
  } catch (e) {
    // Ignore logging errors
  }
}

async function runSync(job, connection, connectorDef, destinationDef) {
  const source = buildConnector(connectorDef.type, connectorDef.config);
  const destination = buildDestination(destinationDef.type, destinationDef.config);

  logJob(job.id, 'INFO', `Initializing Airbyte sync job ${job.id} for connection "${connection.name}"`);
  logJob(job.id, 'INFO', `Source: ${connectorDef.name || connectorDef.type} (${connectorDef.type}) | Destination: ${destinationDef.name || destinationDef.type} (${destinationDef.type})`);

  // Parse sync catalog (multi-stream)
  let configuredStreams = [];
  if (connection.sync_catalog) {
    try {
      const parsed = typeof connection.sync_catalog === 'string' ? JSON.parse(connection.sync_catalog) : connection.sync_catalog;
      if (Array.isArray(parsed) && parsed.length > 0) {
        configuredStreams = parsed.filter(s => s.enabled !== false);
      }
    } catch (e) {}
  }

  // Fallback to single stream from source_table if no catalog
  if (configuredStreams.length === 0) {
    configuredStreams = [{
      name: connection.source_table || 'demo_users',
      sync_mode: connection.sync_mode || 'full_refresh_overwrite',
      cursor_field: connection.incremental_key || 'id',
      primary_key: 'id',
      enabled: true
    }];
  }

  logJob(job.id, 'INFO', `Configured ${configuredStreams.length} stream(s) for replication: [${configuredStreams.map(s => s.name).join(', ')}]`);

  // Parse cursor state
  let stateMap = {};
  if (connection.cursor_value) {
    try {
      const parsed = JSON.parse(connection.cursor_value);
      if (typeof parsed === 'object' && parsed !== null) stateMap = parsed;
      else stateMap[configuredStreams[0]?.name] = connection.cursor_value;
    } catch (e) {
      stateMap[configuredStreams[0]?.name] = connection.cursor_value;
    }
  }

  let totalRows = 0;
  let totalBytes = 0;
  const streamStats = {};

  for (const stream of configuredStreams) {
    const streamName = stream.name;
    const mode = stream.sync_mode || connection.sync_mode || 'full_refresh_overwrite';
    const cursor = stateMap[streamName] || null;
    const cursorField = stream.cursor_field || connection.incremental_key || 'id';

    logJob(job.id, 'INFO', `[Stream: ${streamName}] Starting replication (mode: ${mode}, cursor: ${cursor || 'none'})`);

    try {
      const extractResult = await source.extract(streamName, mode, cursor, cursorField, 10000);
      const rows = extractResult.rows || [];
      logJob(job.id, 'INFO', `[Stream: ${streamName}] Emitted ${rows.length} RECORD messages`);

      const loadResult = await destination.load(rows, streamName, {
        syncId: job.id,
        connectionId: connection.id,
        prefix: connection.prefix || 'airbyte_raw_',
        syncMode: mode
      });

      logJob(job.id, 'INFO', `[Stream: ${streamName}] Successfully loaded ${loadResult.rowsLoaded} records to destination`);

      totalRows += loadResult.rowsLoaded;
      totalBytes += loadResult.bytesWritten;

      streamStats[streamName] = {
        records: loadResult.rowsLoaded,
        bytes: loadResult.bytesWritten,
        syncMode: mode,
        target: loadResult.target
      };

      if (extractResult.nextCursor !== undefined && extractResult.nextCursor !== null) {
        stateMap[streamName] = extractResult.nextCursor;
        logJob(job.id, 'INFO', `[Stream: ${streamName}] Advanced state cursor to "${extractResult.nextCursor}"`);
      }
    } catch (streamErr) {
      logJob(job.id, 'ERROR', `[Stream: ${streamName}] Failed: ${streamErr.message}`);
      throw streamErr;
    }
  }

  // Update cursor state on connection
  const cursorValueStr = Object.keys(stateMap).length > 0 ? JSON.stringify(stateMap) : null;
  const firstCursor = Object.values(stateMap)[0];
  db.prepare('UPDATE connections SET cursor_value = ? WHERE id = ?').run(
    cursorValueStr || (firstCursor ? String(firstCursor) : null),
    connection.id
  );

  // Update stream stats on job
  db.prepare('UPDATE sync_jobs SET stream_stats = ? WHERE id = ?').run(
    JSON.stringify(streamStats),
    job.id
  );

  const summaryMsg = `Airbyte sync completed: ${totalRows} records replicated across ${configuredStreams.length} stream(s)`;
  logJob(job.id, 'INFO', summaryMsg);

  return {
    rowsSynced: totalRows,
    bytesSynced: totalBytes,
    streamStats,
    message: summaryMsg
  };
}

module.exports = {
  runSync,
  buildConnector,
  buildDestination,
  logJob
};
