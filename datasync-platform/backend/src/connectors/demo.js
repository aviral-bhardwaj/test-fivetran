const SourceConnector = require('./base');

const SAMPLE_DATA = {
  demo_users: Array.from({ length: 20 }, (_, i) => ({ id: i + 1, name: `User ${i + 1}`, email: `user${i + 1}@example.com`, city: 'City', signup_date: new Date(Date.now() - i * 86400000).toISOString() })),
  demo_orders: Array.from({ length: 30 }, (_, i) => ({ id: i + 1, user_id: (i % 20) + 1, product: `Product ${(i % 5) + 1}`, amount: (i + 1) * 10, status: 'completed', order_date: new Date(Date.now() - i * 86400000).toISOString() })),
  demo_products: Array.from({ length: 10 }, (_, i) => ({ id: i + 1, name: `Product ${i + 1}`, category: 'Demo', price: (i + 1) * 10, in_stock: true }))
};

class DemoConnector extends SourceConnector {
  async testConnection() {
    return { success: true, message: 'Demo connector ready' };
  }

  async discoverSchema(tableName) {
    const rows = SAMPLE_DATA[tableName] || [];
    if (rows.length === 0) return { table: tableName, columns: [] };
    const columns = Object.keys(rows[0]).map(key => ({ name: key, type: typeof rows[0][key] }));
    return { table: tableName, columns };
  }

  async extract(tableName, mode, cursor, incrementalKey, batchSize = 1000) {
    let rows = SAMPLE_DATA[tableName] || [];
    let nextCursor = cursor;

    if (mode === 'incremental' && incrementalKey) {
      if (cursor) {
        rows = rows.filter(r => r[incrementalKey] > cursor);
      }
      if (rows.length > 0) {
        nextCursor = rows.reduce((max, r) => r[incrementalKey] > max ? r[incrementalKey] : max, rows[0][incrementalKey]);
      }
    }

    return { rows, nextCursor, totalRows: rows.length };
  }
}

module.exports = DemoConnector;
