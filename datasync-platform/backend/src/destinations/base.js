class DestinationConnector {
  constructor(config) {
    this.config = typeof config === 'string' ? JSON.parse(config) : config;
  }

  async load(rows, tableName, metadata) {
    throw new Error('Not implemented');
  }
}

module.exports = DestinationConnector;
