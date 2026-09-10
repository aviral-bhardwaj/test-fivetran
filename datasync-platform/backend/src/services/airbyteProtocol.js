/**
 * Airbyte Protocol Specification & Core Classes
 * Defines standard protocol message types, source and destination interfaces.
 */

const SyncMode = {
  FULL_REFRESH_OVERWRITE: 'full_refresh_overwrite',
  FULL_REFRESH_APPEND: 'full_refresh_append',
  INCREMENTAL_APPEND: 'incremental_append',
  INCREMENTAL_DEDUPED: 'incremental_deduped'
};

const MessageType = {
  RECORD: 'RECORD',
  STATE: 'STATE',
  LOG: 'LOG',
  SPEC: 'SPEC',
  CONNECTION_STATUS: 'CONNECTION_STATUS'
};

class AirbyteMessage {
  static record(stream, data, emittedAt = Date.now()) {
    return {
      type: MessageType.RECORD,
      record: {
        stream,
        data,
        emitted_at: emittedAt
      }
    };
  }

  static state(stream, cursorValue) {
    return {
      type: MessageType.STATE,
      state: {
        stream,
        cursor: cursorValue,
        emitted_at: Date.now()
      }
    };
  }

  static log(level, message) {
    return {
      type: MessageType.LOG,
      log: {
        level: level.toUpperCase(),
        message,
        timestamp: new Date().toISOString()
      }
    };
  }

  static status(status, message) {
    return {
      type: MessageType.CONNECTION_STATUS,
      connectionStatus: {
        status: status ? 'SUCCEEDED' : 'FAILED',
        message
      }
    };
  }
}

class AirbyteSource {
  constructor(config = {}) {
    this.config = typeof config === 'string' ? JSON.parse(config) : config;
  }

  async spec() {
    throw new Error('spec() not implemented');
  }

  async check() {
    return AirbyteMessage.status(true, 'Connection test succeeded');
  }

  async discover() {
    throw new Error('discover() not implemented');
  }

  async *read(configuredStreams = [], state = {}, logger = console.log) {
    throw new Error('read() not implemented');
  }
}

class AirbyteDestination {
  constructor(config = {}) {
    this.config = typeof config === 'string' ? JSON.parse(config) : config;
  }

  async spec() {
    throw new Error('spec() not implemented');
  }

  async check() {
    return AirbyteMessage.status(true, 'Destination connection test succeeded');
  }

  async write(configuredStreams, recordsByStream, metadata = {}, logger = console.log) {
    throw new Error('write() not implemented');
  }
}

module.exports = {
  SyncMode,
  MessageType,
  AirbyteMessage,
  AirbyteSource,
  AirbyteDestination
};
