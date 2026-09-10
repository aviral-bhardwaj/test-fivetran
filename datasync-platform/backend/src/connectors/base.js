class SourceConnector {
  constructor(config) {
    this.config = typeof config === 'string' ? JSON.parse(config) : config;
  }

  async testConnection() {
    throw new Error('Not implemented');
  }

  async discoverSchema(tableName) {
    throw new Error('Not implemented');
  }

  async extract(tableName, mode, cursor, incrementalKey, batchSize) {
    throw new Error('Not implemented');
  }
}

module.exports = SourceConnector;
