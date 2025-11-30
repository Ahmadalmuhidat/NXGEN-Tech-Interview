const prisma = require('../config/prismaClient');

exports.createDevice = async (req, res) => {
  if (!req.body.name) {
    return res.status(400).json({ error_message: "Device name is required" });
  }

  // Check for duplicate device name
  const device = await prisma.Devices.create({
    data: {
      name: req.body.name,
    },
  });

  res.status(201).json(device);
};

exports.getDevices = async (req, res) => {
  const devices = await prisma.Devices.findMany(); // Fetch all devices
  res.status(200).json(devices);
}

exports.getDevicesStats = async (req, res) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const interval = setInterval(async () => {
    try {
      // Fetch devices with their time series data count
      const devices = await prisma.devices.findMany({
        select: {
          id: true,
          name: true,
          timeSeries: {
            select: { id: true },
          },
        },
      });

      // Prepare stats data
      const stats = devices.map(device => ({
        id: device.id,
        name: device.name,
        dataCount: device.timeSeries.length,
      }));

      res.write(`data: ${JSON.stringify(stats)}\n\n`);
    } catch (error) {
      console.error('Error fetching device stats:', error);
      res.write(`event: error\ndata: ${JSON.stringify({ error: 'Failed to fetch device stats' })}\n\n`);
    }
  }, 1000); // Poll every second

  req.on('close', () => {
    clearInterval(interval);
    console.log('SSE connection closed for device distribution');
  });
};
