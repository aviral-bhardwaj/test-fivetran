const request = require('supertest');
const path = require('path');
const fs = require('fs');

process.env.DB_PATH = path.join(__dirname, 'test.db');
const app = require('../src/index');
const db = require('../src/db/connection');

describe('API Tests', () => {
  afterAll(() => {
    db.close();
    if (fs.existsSync(process.env.DB_PATH)) {
      fs.unlinkSync(process.env.DB_PATH);
    }
  });

  let orgId, connId, destId, connectionId;

  it('GET /api/health should return 200', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('ok');
  });

  it('POST /api/organizations should create org', async () => {
    const res = await request(app).post('/api/organizations').send({ name: 'Test Org' });
    expect(res.statusCode).toEqual(201);
    orgId = res.body.id;
  });

  it('GET /api/organizations should list orgs', async () => {
    const res = await request(app).get('/api/organizations');
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('POST /api/connectors should create demo connector', async () => {
    const res = await request(app).post('/api/connectors').send({
      organization_id: orgId || 1,
      name: 'Demo Conn',
      type: 'demo',
      config: {}
    });
    expect(res.statusCode).toEqual(201);
    connId = res.body.id;
  });

  it('POST /api/destinations should create local_file destination', async () => {
    const res = await request(app).post('/api/destinations').send({
      organization_id: orgId || 1,
      name: 'Local Dest',
      type: 'local_file',
      config: { outputDir: './data/test_syncs' }
    });
    expect(res.statusCode).toEqual(201);
    destId = res.body.id;
  });

  it('POST /api/connections should create connection', async () => {
    const res = await request(app).post('/api/connections').send({
      organization_id: orgId || 1,
      name: 'Test Connection',
      connector_id: connId,
      destination_id: destId,
      source_table: 'demo_users'
    });
    expect(res.statusCode).toEqual(201);
    connectionId = res.body.id;
  });

  it('POST /api/connections/:id/sync should trigger sync', async () => {
    const res = await request(app).post(`/api/connections/${connectionId}/sync`);
    expect(res.statusCode).toEqual(201);
    expect(res.body.status).toEqual('pending');
  });

  it('GET /api/syncs should list sync jobs', async () => {
    const res = await request(app).get('/api/syncs');
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('GET /api/metrics should return metrics object', async () => {
    const res = await request(app).get('/api/metrics');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('total_syncs');
    expect(res.body).toHaveProperty('active_connections');
  });
});
