const request = require('supertest');
const app = require('../src/app');
const { HEARTBEAT_TIMEOUT_MS } = require('../src/utils/constants');
const Device = require('../src/models/Device');

require('./setup');

describe('Device ONLINE/OFFLINE Status (30-second timeout)', () => {
  let deviceId;

  beforeEach(async () => {
    const res = await request(app)
      .post('/devices')
      .send({ name: 'Status Test Device' });
    deviceId = res.body.id;
  });

  test('newly registered device should be OFFLINE', async () => {
    const res = await request(app).get(`/devices/${deviceId}`);
    expect(res.body.status).toBe('OFFLINE');
  });

  test('device should be ONLINE immediately after heartbeat', async () => {
    await request(app)
      .post(`/devices/${deviceId}/heartbeat`)
      .send({ status: 'OK' });

    const res = await request(app).get(`/devices/${deviceId}`);
    expect(res.body.status).toBe('ONLINE');
  });

  test('device should be OFFLINE after 30 seconds without heartbeat', async () => {
    // Directly set lastHeartbeat to 31 seconds ago to simulate timeout
    const pastTime = new Date(Date.now() - HEARTBEAT_TIMEOUT_MS - 1000);
    await Device.findByIdAndUpdate(deviceId, { lastHeartbeat: pastTime });

    const res = await request(app).get(`/devices/${deviceId}`);
    expect(res.body.status).toBe('OFFLINE');
  });

  test('device should be ONLINE if heartbeat is within 30 seconds', async () => {
    // Set lastHeartbeat to 10 seconds ago (within threshold)
    const recentTime = new Date(Date.now() - 10000);
    await Device.findByIdAndUpdate(deviceId, { lastHeartbeat: recentTime });

    const res = await request(app).get(`/devices/${deviceId}`);
    expect(res.body.status).toBe('ONLINE');
  });

  test('device should be ONLINE just within the 30-second window', async () => {
    // Set lastHeartbeat to 29 seconds ago (within threshold, near boundary)
    const boundaryTime = new Date(Date.now() - HEARTBEAT_TIMEOUT_MS + 1000);
    await Device.findByIdAndUpdate(deviceId, { lastHeartbeat: boundaryTime });

    const res = await request(app).get(`/devices/${deviceId}`);
    expect(res.body.status).toBe('ONLINE');
  });

  test('device should be OFFLINE at 31 seconds (just past boundary)', async () => {
    const pastBoundary = new Date(Date.now() - HEARTBEAT_TIMEOUT_MS - 1000);
    await Device.findByIdAndUpdate(deviceId, { lastHeartbeat: pastBoundary });

    const res = await request(app).get(`/devices/${deviceId}`);
    expect(res.body.status).toBe('OFFLINE');
  });

  test('status should reflect in list endpoint', async () => {
    // Register a second device
    const d2 = await request(app)
      .post('/devices')
      .send({ name: 'Device 2' });

    // Send heartbeat only for first device
    await request(app)
      .post(`/devices/${deviceId}/heartbeat`)
      .send({ status: 'OK' });

    const res = await request(app).get('/devices');
    const device1 = res.body.find((d) => d.id === deviceId);
    const device2 = res.body.find((d) => d.id === d2.body.id);

    expect(device1.status).toBe('ONLINE');
    expect(device2.status).toBe('OFFLINE');
  });
});

describe('Fleet Summary', () => {
  test('should return zeros when no devices exist', async () => {
    const res = await request(app).get('/summary');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ total: 0, online: 0, offline: 0 });
  });

  test('should return correct summary counts', async () => {
    // Register 3 devices
    const d1 = await request(app)
      .post('/devices')
      .send({ name: 'Device 1' });
    const d2 = await request(app)
      .post('/devices')
      .send({ name: 'Device 2' });
    await request(app).post('/devices').send({ name: 'Device 3' });

    // Send heartbeat for first 2 (making them ONLINE)
    await request(app)
      .post(`/devices/${d1.body.id}/heartbeat`)
      .send({ status: 'OK' });
    await request(app)
      .post(`/devices/${d2.body.id}/heartbeat`)
      .send({ status: 'OK' });

    const res = await request(app).get('/summary');

    expect(res.body.total).toBe(3);
    expect(res.body.online).toBe(2);
    expect(res.body.offline).toBe(1);
  });

  test('should count timed-out devices as OFFLINE', async () => {
    const d1 = await request(app)
      .post('/devices')
      .send({ name: 'Device 1' });

    // Set heartbeat to past (expired)
    const pastTime = new Date(Date.now() - HEARTBEAT_TIMEOUT_MS - 5000);
    await Device.findByIdAndUpdate(d1.body.id, { lastHeartbeat: pastTime });

    const res = await request(app).get('/summary');

    expect(res.body.total).toBe(1);
    expect(res.body.online).toBe(0);
    expect(res.body.offline).toBe(1);
  });
});
