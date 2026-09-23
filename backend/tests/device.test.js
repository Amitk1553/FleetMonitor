const request = require('supertest');
const app = require('../src/app');

require('./setup');

describe('Device Registration', () => {
  test('should register a new device and return UUID', async () => {
    const res = await request(app)
      .post('/devices')
      .send({ name: 'Lab Device 01' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    // Verify UUID format (v4)
    expect(res.body.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
    expect(res.body.name).toBe('Lab Device 01');
    expect(res.body.status).toBe('OFFLINE');
    expect(res.body.last_heartbeat).toBeNull();
  });

  test('should return 400 for missing name', async () => {
    const res = await request(app).post('/devices').send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('should return 400 for empty name', async () => {
    const res = await request(app).post('/devices').send({ name: '' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('should return 400 for whitespace-only name', async () => {
    const res = await request(app).post('/devices').send({ name: '   ' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('should trim device name', async () => {
    const res = await request(app)
      .post('/devices')
      .send({ name: '  Lab Device  ' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Lab Device');
  });
});

describe('List Devices', () => {
  test('should return empty array when no devices', async () => {
    const res = await request(app).get('/devices');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('should list all registered devices', async () => {
    await request(app).post('/devices').send({ name: 'Device A' });
    await request(app).post('/devices').send({ name: 'Device B' });

    const res = await request(app).get('/devices');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0]).toHaveProperty('id');
    expect(res.body[0]).toHaveProperty('name');
    expect(res.body[0]).toHaveProperty('status');
    expect(res.body[0]).toHaveProperty('last_heartbeat');
  });
});

describe('Get Device Details', () => {
  test('should get a specific device by ID', async () => {
    const createRes = await request(app)
      .post('/devices')
      .send({ name: 'Device A' });

    const res = await request(app).get(`/devices/${createRes.body.id}`);

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Device A');
    expect(res.body.id).toBe(createRes.body.id);
  });

  test('should return 404 for non-existent device', async () => {
    const res = await request(app).get(
      '/devices/00000000-0000-4000-8000-000000000000'
    );

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});
