const prisma = require("../../src/config/prismaClient");
const devicesController = require("../../src/controllers/devicesController");

// Mock the prisma client
jest.mock("../../src/config/prismaClient", () => ({
  Devices: {
    create: jest.fn(),
  }
}));

describe("Devices Controller Unit Tests", () => {
  test("should return 201 for successful device creation", async () => {
    // Mock request and response objects
    const req = {
      body: {
        name: "Device 1"
      }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Mock prisma create method
    prisma.Devices.create.mockResolvedValue({
      id: 1,
      name: "Device 1"
    });

    await devicesController.createDevice(req, res); // Call the createDevice method

    // Assert the response
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      id: 1,
      name: "Device 1"
    });
  });

  test("should return 400 for missing device name", async () => {
    // Mock request and response objects
    const req = {
      body: {
        name: ""
      }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await devicesController.createDevice(req, res); // Call the createDevice method

    // Assert the response
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error_message: "Device name is required" });
  });

  test("should return 200 for successful devices fetching", async () => {
    // Mock request and response objects
    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Mock prisma findMany method
    const devicesList = [
      { id: 1, name: "Device 1" },
      { id: 2, name: "Device 2" }
    ];

    // Mock resolved value
    prisma.Devices.findMany = jest.fn().mockResolvedValue(devicesList);

    await devicesController.getDevices(req, res); // Call the getDevices method

    // Assert the response
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(devicesList);
  });
});
