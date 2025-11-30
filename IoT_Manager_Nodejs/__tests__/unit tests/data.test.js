const prisma = require("../../src/config/prismaClient");
const dataController = require("../../src/controllers/dataController");

// Mock the prisma client
jest.mock("../../src/config/prismaClient", () => ({
  TimeSeries: {
    findMany: jest.fn(),
    create: jest.fn()
  }
}));

describe("Data Controller Unit Tests", () => {
  test("should return 400 for missing query parameters", async () => {
    // Mock request and response objects
    const req = {
      params: {
        id: 1
      },
      query: {
        start_time: "",
        end_time: ""
      }
    };
    const res = {
      status: jest.fn().mockReturnThis(), // to allow chaining
      json: jest.fn()
    };


    // Call the getData method
    await dataController.getData(req, res);

    // Assert the response
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error_message: "Missing required query parameters" });
  });

  test("should return 202 for successful data creation", async () => {
    // Mock request and response objects
    const req = {
      params: {
        id: 1
      },
      body: {
        value: "42",
        timestamp: "2024-01-01T00:00:00Z"
      }
    };
    const res = {
      status: jest.fn().mockReturnThis(), // to allow chaining
      json: jest.fn()
    };

    // Mock prisma create method
    const createdData = {
      deviceId: 1,
      deviceId: 1,
      value: 42,
      timestamp: new Date("2024-01-01T00:00:00Z")
    };

    prisma.TimeSeries.create = jest.fn().mockResolvedValue(createdData); // Mock resolved value

    await dataController.createData(req, res); // Call the createData method

    // Assert the response
    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.json).toHaveBeenCalledWith({ data: createdData });
  });
});