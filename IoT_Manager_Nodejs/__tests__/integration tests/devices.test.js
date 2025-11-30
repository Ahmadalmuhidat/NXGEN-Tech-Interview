const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/config/prismaClient');

describe('Devices Integration Tests', () => {
  // Clean up data before each test
  beforeEach(async () => {
    await prisma.TimeSeries.deleteMany({});
    await prisma.Devices.deleteMany({});
  });

  // Disconnect Prisma after all tests
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('POST /devices - create device', async () => {
    const response = await request(app).post('/devices').send({ name: 'Device 1' }); // Send POST request

    // Verify response
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('Device 1');
  });

  test('POST /devices - fail when name is missing', async () => {
    const response = await request(app).post('/devices').send({ name: '' }); // Send POST request with missing name

    // Verify response
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error_message: 'Device name is required' });
  });

  test('GET /devices - fetch all devices', async () => {
    await prisma.Devices.create({ data: { name: 'Device 1' } }); // Insert test device

    const response = await request(app).get('/devices'); // Send GET request

    // Verify response
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].name).toBe('Device 1');
  });
});
