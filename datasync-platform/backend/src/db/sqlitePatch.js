// Node 24 compatibility patch for better-sqlite3:
// Prevents premature GC of Statement objects which triggers an assertion failure
// (env != nullptr in RemoveEnvironmentCleanupHook) in Node.js v24.
const Database = require('better-sqlite3');

if (!global.__sqliteStatementsRetained) {
  global.__sqliteStatementsRetained = [];
  try {
    global.__dummyDatabase = new Database(':memory:');
    const symbols = Object.getOwnPropertySymbols(global.__dummyDatabase);
    if (symbols.length > 0) {
      const cppdb = global.__dummyDatabase[symbols[0]];
      const proto = Object.getPrototypeOf(cppdb);
      if (proto && proto.prepare) {
        const origPrepare = proto.prepare;
        proto.prepare = function(...args) {
          const stmt = origPrepare.apply(this, args);
          global.__sqliteStatementsRetained.push(stmt);
          return stmt;
        };
      }
    }
  } catch (err) {
    console.error('Failed to apply Node 24 sqlite patch:', err);
  }
}

module.exports = Database;
