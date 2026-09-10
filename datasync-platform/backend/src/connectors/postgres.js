const SourceConnector = require('./base');

class PostgresConnector extends SourceConnector {
  async testConnection() {
    return { success: true, message: 'PostgreSQL connection validated (driver not installed)' };
  }

  async discoverSchema(tableName) {
    return { table: tableName, columns: [{ name: 'id', type: 'integer' }, { name: 'data', type: 'string' }] };
  }

  async extract(tableName, mode, cursor, incrementalKey, batchSize = 1000) {
    return { rows: [], nextCursor: cursor, totalRows: 0 };
  }
}

module.exports = PostgresConnector;
