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
    
    // Check existing table and columns
    const tableCheck = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(tableName);
    if (!tableCheck) {
      const keys = Object.keys(rows[0]);
      const cols = keys.map(k => `"${k}" TEXT`).join(', ');
      db.exec(`CREATE TABLE "${tableName}" (${cols})`);
    } else {
      // Table exists, check if any columns are missing
      const existingCols = db.prepare(`PRAGMA table_info("${tableName}")`).all().map(c => c.name);
      for (const k of Object.keys(rows[0])) {
        if (!existingCols.includes(k)) {
          try {
            db.exec(`ALTER TABLE "${tableName}" ADD COLUMN "${k}" TEXT`);
          } catch (e) {
            // column might already exist or ignore
          }
        }
      }
    }

    // Now get all available columns in table
    const tableCols = db.prepare(`PRAGMA table_info("${tableName}")`).all().map(c => c.name);
    // Keys to insert
    const insertKeys = tableCols.filter(c => rows.some(r => r[c] !== undefined));
    const activeKeys = insertKeys.length > 0 ? insertKeys : tableCols;

    const placeholders = activeKeys.map(() => '?').join(', ');
    const stmt = db.prepare(`INSERT INTO "${tableName}" (${activeKeys.map(k => `"${k}"`).join(', ')}) VALUES (${placeholders})`);

    const transaction = db.transaction((rowsToInsert) => {
      for (const row of rowsToInsert) {
        stmt.run(...activeKeys.map(k => row[k] !== undefined && row[k] !== null ? String(row[k]) : ''));
      }
    });

    transaction(rows);
    db.close();

    const estimatedSize = rows.length * activeKeys.length * 10;
    return { rowsLoaded: rows.length, bytesWritten: estimatedSize };
  }
}

module.exports = SqliteWarehouseDestination;
