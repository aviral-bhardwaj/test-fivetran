const PostgresConnector = require('../connectors/postgres');
const MysqlConnector = require('../connectors/mysql');
const CsvConnector = require('../connectors/csv');
const DemoConnector = require('../connectors/demo');

function buildConnector(type, config) {
  switch (type) {
    case 'postgres': return new PostgresConnector(config);
    case 'mysql': return new MysqlConnector(config);
    case 'csv': return new CsvConnector(config);
    case 'demo': return new DemoConnector(config);
    default: throw new Error(`Unknown connector type: ${type}`);
  }
}

async function discoverSchema(connection, connectorDef) {
  const connector = buildConnector(connectorDef.type, connectorDef.config);
  return await connector.discoverSchema(connection.source_table);
}

module.exports = { discoverSchema, buildConnector };
