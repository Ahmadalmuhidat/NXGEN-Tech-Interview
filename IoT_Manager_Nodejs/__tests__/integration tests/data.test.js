const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/config/prismaClient');
const { publishToQueue } = require('../../src/config/producer');

jest.mock('../../src/config/producer'); // Mock the message queue producer

describe('Data Integration Tests', () => {
  const deviceId = 1;

  // Setup: Ensure the test device exists
  beforeAll(async () => {
    await prisma.Devices.upsert({
      where: { id: deviceId },
      update: {},
      create: { id: deviceId, name: 'Test Device' },
    });
  });

  // Clean up data before each test
  beforeEach(async () => {
    await prisma.TimeSeries.deleteMany({ where: { deviceId } });
  });

  // Disconnect Prisma after all tests
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('POST /devices/:id/data - create data successfully', async () => {
    const payload = {
      value: 42,
      timestamp: '2024-01-01T00:00:00Z'
    };

    const response = await request(app).post(`/devices/${deviceId}/data`).send(payload); // Send POST request

    // Verify response
    expect(response.status).toBe(202);
    expect(response.body.data).toMatchObject({ deviceId, value: 42 });
    expect(publishToQueue).toHaveBeenCalled();
  });

  test('GET /devices/:id/data - fail when missing query params', async () => {
    const response = await request(app).get(`/devices/${deviceId}/data`).query({ start_time: '' }); // Send GET request with missing params

    // Verify response
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error_message: 'Missing required query parameters' });
  });

  test('GET /devices/data/count/last24h - fetch data count', async () => {
    const now = new Date(); // Current timestamp
    await prisma.TimeSeries.createMany({
      data: [
        { deviceId, value: 1, timestamp: now },
        { deviceId, value: 2, timestamp: now },
      ],
    }); // Insert test data

    const response = await request(app).get('/devices/data/count/last24h'); // Send GET request

    // Verify response
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toBe(2);
  });
});
