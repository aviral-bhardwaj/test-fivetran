const DestinationConnector = require('./base');
const fs = require('fs');
const path = require('path');

class LocalFileDestination extends DestinationConnector {
  async load(rows, tableName, metadata) {
    const outputDir = this.config.outputDir || path.join(__dirname, '../../data/syncs');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const timestamp = Date.now();
    const filePath = path.join(outputDir, `${tableName}_${metadata.syncId}_${timestamp}.jsonl`);
    
    const lines = rows.map(r => JSON.stringify(r));
    const content = lines.join('\n') + (lines.length > 0 ? '\n' : '');
    
    fs.writeFileSync(filePath, content);
    
    return { rowsLoaded: rows.length, bytesWritten: Buffer.byteLength(content, 'utf8') };
  }
}

module.exports = LocalFileDestination;
