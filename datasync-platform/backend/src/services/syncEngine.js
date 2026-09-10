const { buildConnector } = require('./schemaService');
const LocalFileDestination = require('../destinations/localFile');
const SqliteWarehouseDestination = require('../destinations/sqliteWarehouse');
const db = require('../db/connection');

function buildDestination(type, config) {
  switch (type) {
    case 'local_file': return new LocalFileDestination(config);
    case 'sqlite_warehouse': return new SqliteWarehouseDestination(config);
    default: throw new Error(`Unknown destination type: ${type}`);
  }
}

async function runSync(job, connection, connectorDef, destinationDef) {
  const source = buildConnector(connectorDef.type, connectorDef.config);
  const destination = buildDestination(destinationDef.type, destinationDef.config);

  const extractResult = await source.extract(
    connection.source_table, 
    connection.sync_mode, 
    connection.cursor_value, 
    connection.incremental_key, 
    10000
  );

  const loadResult = await destination.load(
    extractResult.rows, 
    connection.source_table, 
    { syncId: job.id, connectionId: connection.id }
  );

  if (connection.sync_mode === 'incremental' && extractResult.nextCursor !== undefined && extractResult.nextCursor !== null) {
    db.prepare('UPDATE connections SET cursor_value = ? WHERE id = ?').run(
      String(extractResult.nextCursor), connection.id
    );
  }

  return { 
    rowsSynced: loadResult.rowsLoaded, 
    bytesSynced: loadResult.bytesWritten, 
    message: `Synced ${loadResult.rowsLoaded} rows successfully` 
  };
}

module.exports = { runSync, buildDestination };
