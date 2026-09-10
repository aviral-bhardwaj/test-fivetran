const { test, describe, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const path = require('path');
const fs = require('fs');

process.env.DB_PATH = path.join(__dirname, 'node_test.db');
const app = require('../src/index');
const db = require('../src/db/connection');

describe('DataSync Platform API Integration Tests', () => {
  after(() => {
    db.close();
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
    const res = await request(app).post(`/api/connectors/${connId}/test`);
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
    const res = await request(app).post(`/api/connections/${connectionId}/discover`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.table, 'demo_users');
    assert.ok(Array.isArray(res.body.columns));
    assert.ok(res.body.columns.length > 0);
  });

  test('POST /api/connections/:id/sync should trigger sync job', async () => {
    const res = await request(app).post(`/api/connections/${connectionId}/sync`);
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
});
