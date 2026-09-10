const UniversalAirbyteSource = require('../connectors/airbyteSource');
const PostgresConnector = require('../connectors/postgres');
const MysqlConnector = require('../connectors/mysql');
const CsvConnector = require('../connectors/csv');
const DemoConnector = require('../connectors/demo');

function buildConnector(type, config) {
  // Support all catalog types via UniversalAirbyteSource
  return new UniversalAirbyteSource(type, config);
}

async function discoverSchema(connection, connectorDef) {
  const connector = buildConnector(connectorDef.type, connectorDef.config);
  return await connector.discoverSchema(connection.source_table || 'demo_users');
}

async function discoverStreams(connectorDef) {
  const connector = buildConnector(connectorDef.type, connectorDef.config);
  return await connector.discover();
}

module.exports = { discoverSchema, discoverStreams, buildConnector };
