const DestinationConnector = require('./base');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class SqliteWarehouseDestination extends DestinationConnector {
  async load(rows, tableName, metadata) {
    if (rows.length === 0) return { rowsLoaded: 0, bytesWritten: 0 };

    const dbPath = this.config.dbPath || path.join(__dirname, '../../data/warehouse.db');
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const db = new Database(dbPath);
    const keys = Object.keys(rows[0]);
    const cols = keys.map(k => `"${k}" TEXT`).join(', ');
    
    db.exec(`CREATE TABLE IF NOT EXISTS "${tableName}" (${cols})`);

    const placeholders = keys.map(() => '?').join(', ');
    const stmt = db.prepare(`INSERT INTO "${tableName}" (${keys.map(k => `"${k}"`).join(', ')}) VALUES (${placeholders})`);

    const transaction = db.transaction((rowsToInsert) => {
      for (const row of rowsToInsert) {
        stmt.run(...keys.map(k => String(row[k] || '')));
      }
    });

    transaction(rows);
    db.close();

    const estimatedSize = rows.length * keys.length * 10; // rough estimate
    return { rowsLoaded: rows.length, bytesWritten: estimatedSize };
  }
}

module.exports = SqliteWarehouseDestination;
