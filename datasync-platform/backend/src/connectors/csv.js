const SourceConnector = require('./base');
const fs = require('fs');

class CsvConnector extends SourceConnector {
  async testConnection() {
    const exists = fs.existsSync(this.config.path);
    if (!exists) throw new Error('File not found');
    return { success: true, message: 'CSV file validated' };
  }

  async discoverSchema(tableName) {
    if (!fs.existsSync(this.config.path)) return { table: tableName, columns: [] };
    const content = fs.readFileSync(this.config.path, 'utf8');
    const firstLine = content.split('\n')[0];
    if (!firstLine) return { table: tableName, columns: [] };
    const columns = firstLine.split(',').map(name => ({ name: name.trim(), type: 'string' }));
    return { table: tableName, columns };
  }

  async extract(tableName, mode, cursor, incrementalKey, batchSize = 1000) {
    if (!fs.existsSync(this.config.path)) return { rows: [], nextCursor: cursor, totalRows: 0 };
    const content = fs.readFileSync(this.config.path, 'utf8');
    const lines = content.split('\n').filter(l => l.trim().length > 0);
    if (lines.length <= 1) return { rows: [], nextCursor: cursor, totalRows: 0 };
    
    const headers = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1).map(line => {
      const values = line.split(',');
      const row = {};
      headers.forEach((h, i) => row[h] = values[i] ? values[i].trim() : null);
      return row;
    });
    
    return { rows, nextCursor: cursor, totalRows: rows.length };
  }
}

module.exports = CsvConnector;
