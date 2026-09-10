const { test, describe, after } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const { Readable } = require('stream');

process.env.DB_PATH = path.join(__dirname, 'node_test.db');
const app = require('../src/index');
const db = require('../src/db/connection');

function request(appInstance) {
  function makeCall(method, url, body = null) {
    return new Promise((resolve) => {
      const payload = body ? Buffer.from(typeof body === 'string' ? body : JSON.stringify(body)) : null;
      const req = payload ? Readable.from([payload]) : Readable.from([]);
      req.method = method.toUpperCase();
      req.url = url;
      req.headers = {
        'content-type': 'application/json',
        ...(payload ? { 'content-length': String(payload.length) } : {})
      };
      req.connection = { remoteAddress: '127.0.0.1' };
      req.socket = req.connection;
      let resData = '';
      const res = {
        statusCode: 200,
        headers: {},
        setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
        getHeader(k) { return this.headers[k.toLowerCase()]; },
        writeHead(status, h) { this.statusCode = status; if (h) Object.assign(this.headers, h); },
        write(chunk) { if (chunk) resData += chunk; },
        end(chunk) {
          if (chunk) resData += chunk;
          let parsed = resData;
          try { parsed = JSON.parse(resData); } catch (e) {}
          resolve({ status: this.statusCode, headers: this.headers, body: parsed });
        }
      };
      appInstance(req, res);
    });
  }

  return {
    get: (url) => makeCall('GET', url),
    post: (url) => ({
      send: (body) => makeCall('POST', url, body)
    }),
    put: (url) => ({
      send: (body) => makeCall('PUT', url, body)
    }),
    delete: (url) => makeCall('DELETE', url)
  };
}

describe('DataSync Platform API Integration Tests', () => {
  after(() => {
    // Keep statements alive for Node 24
    if (fs.existsSync(process.env.DB_PATH)) {
      try { fs.unlinkSync(process.env.DB_PATH); } catch (e) {}
    }
  });

  let orgId, connId, destId, connectionId;

  test('GET /api/health should return ok', async () => {
    const res = await request(app).get('/api/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'ok');
  });

  test('POST /api/organizations should create organization', async () => {
    const res = await request(app).post('/api/organizations').send({ name: 'Integration Org' });
    assert.strictEqual(res.status, 201);
    assert.ok(res.body.id);
    orgId = res.body.id;
  });

  test('GET /api/organizations should list organizations', async () => {
    const res = await request(app).get('/api/organizations');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body));
    assert.ok(res.body.length > 0);
  });

  test('POST /api/connectors should create demo connector', async () => {
    const res = await request(app).post('/api/connectors').send({
      organization_id: orgId || 1,
      name: 'Demo Source Connector',
      type: 'demo',
      config: {}
    });
    assert.strictEqual(res.status, 201);
    connId = res.body.id;
  });

  test('POST /api/connectors/:id/test should validate connection', async () => {
    const res = await request(app).post(`/api/connectors/${connId}/test`).send({});
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
  });

  test('POST /api/destinations should create local_file destination', async () => {
    const res = await request(app).post('/api/destinations').send({
      organization_id: orgId || 1,
      name: 'Local Target Destination',
      type: 'local_file',
      config: { outputDir: './data/node_test_syncs' }
    });
    assert.strictEqual(res.status, 201);
    destId = res.body.id;
  });

  test('POST /api/connections should create connection pipeline', async () => {
    const res = await request(app).post('/api/connections').send({
      organization_id: orgId || 1,
      name: 'Integration Pipeline',
      connector_id: connId,
      destination_id: destId,
      source_table: 'demo_users',
      sync_mode: 'full'
    });
    assert.strictEqual(res.status, 201);
    connectionId = res.body.id;
  });

  test('POST /api/connections/:id/discover should discover schema', async () => {
    const res = await request(app).post(`/api/connections/${connectionId}/discover`).send({});
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.table, 'demo_users');
    assert.ok(Array.isArray(res.body.columns));
    assert.ok(res.body.columns.length > 0);
  });

  test('POST /api/connections/:id/sync should trigger sync job', async () => {
    const res = await request(app).post(`/api/connections/${connectionId}/sync`).send({});
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.status, 'pending');
  });

  test('GET /api/syncs should list sync jobs', async () => {
    const res = await request(app).get('/api/syncs');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body));
    assert.ok(res.body.length > 0);
  });

  test('GET /api/metrics should return aggregated metrics', async () => {
    const res = await request(app).get('/api/metrics');
    assert.strictEqual(res.status, 200);
    assert.ok('total_syncs' in res.body);
    assert.ok('active_connections' in res.body);
  });

  test('GET /api/catalog/sources should return connector catalog', async () => {
    const res = await request(app).get('/api/catalog/sources');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body));
    assert.ok(res.body.length >= 10);
    const github = res.body.find(c => c.id === 'github');
    assert.ok(github);
    assert.strictEqual(github.category, 'api');
  });

  test('GET /api/catalog/destinations should return destination catalog', async () => {
    const res = await request(app).get('/api/catalog/destinations');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body));
    assert.ok(res.body.length >= 5);
  });

  test('GET /api/catalog/sources/stripe/spec should return spec schema', async () => {
    const res = await request(app).get('/api/catalog/sources/stripe/spec');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.id, 'stripe');
    assert.ok(res.body.spec.properties.api_key);
  });

  test('GET /api/syncs/:id/logs should return job execution logs', async () => {
    // Run worker once to generate logs
    const { runSync } = require('../src/services/syncEngine');
    const conn = db.prepare('SELECT * FROM connections WHERE id = ?').get(connectionId);
    const connector = db.prepare('SELECT * FROM connectors WHERE id = ?').get(conn.connector_id);
    const dest = db.prepare('SELECT * FROM destinations WHERE id = ?').get(conn.destination_id);
    const job = db.prepare('SELECT * FROM sync_jobs WHERE connection_id = ?').get(connectionId);

    await runSync(job, conn, connector, dest);

    const res = await request(app).get(`/api/syncs/${job.id}/logs`);
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body));
    assert.ok(res.body.length > 0);
    assert.ok(res.body[0].message);
    assert.ok(res.body[0].level);
  });
});
