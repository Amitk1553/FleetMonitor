const request = require('supertest');
const app = require('../src/app');

require('./setup');

describe('Heartbeat Handling', () => {
  let deviceId;

  beforeEach(async () => {
    const res = await request(app)
      .post('/devices')
      .send({ name: 'Heartbeat Test Device' });
    deviceId = res.body.id;
  });

  test('should accept a heartbeat and mark device ONLINE', async () => {
    const res = await request(app)
      .post(`/devices/${deviceId}/heartbeat`)
      .send({ status: 'OK' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Heartbeat received');
    expect(res.body.device.status).toBe('ONLINE');
    expect(res.body.device.last_heartbeat).not.toBeNull();
  });

  test('should accept heartbeat with extended fields', async () => {
    const res = await request(app)
      .post(`/devices/${deviceId}/heartbeat`)
      .send({ status: 'OK', cpu_usage: 42, signal_strength: -71 });

    expect(res.status).toBe(200);
    expect(res.body.device.status).toBe('ONLINE');
  });

  test('should accept heartbeat with empty body', async () => {
    const res = await request(app)
      .post(`/devices/${deviceId}/heartbeat`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.device.status).toBe('ONLINE');
  });

  test('should return 404 for heartbeat to unregistered device', async () => {
    const res = await request(app)
      .post('/devices/00000000-0000-4000-8000-000000000000/heartbeat')
      .send({ status: 'OK' });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  test('should update last_heartbeat timestamp on each heartbeat', async () => {
    await request(app)
      .post(`/devices/${deviceId}/heartbeat`)
      .send({ status: 'OK' });

    const first = await request(app).get(`/devices/${deviceId}`);
    const firstTimestamp = first.body.last_heartbeat;

    // Small delay to ensure distinct timestamps
    await new Promise((r) => setTimeout(r, 50));

    await request(app)
      .post(`/devices/${deviceId}/heartbeat`)
      .send({ status: 'OK' });

    const second = await request(app).get(`/devices/${deviceId}`);
    expect(new Date(second.body.last_heartbeat).getTime()).toBeGreaterThan(
      new Date(firstTimestamp).getTime()
    );
  });

  test('should use server timestamp, not client-provided timestamp', async () => {
    const pastTimestamp = '2020-01-01T00:00:00Z';
    await request(app)
      .post(`/devices/${deviceId}/heartbeat`)
      .send({ status: 'OK', timestamp: pastTimestamp });

    const res = await request(app).get(`/devices/${deviceId}`);
    // Device should be ONLINE because server timestamp was used (just now)
    expect(res.body.status).toBe('ONLINE');
  });
});
