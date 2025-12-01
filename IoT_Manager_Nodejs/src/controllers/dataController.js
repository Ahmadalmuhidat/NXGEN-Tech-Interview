const prisma = require('../config/prismaClient');
const { publishToQueue } = require("../config/producer");

exports.createData = async (req, res) => {
  try {
    const message = {
      deviceId: Number(req.params.id),
      value: Number(req.body.value),
      timestamp: new Date(req.body.timestamp)
    };

    await publishToQueue(message); // Publish message to RabbitMQ queue
    return res.status(202).json({ data: message });
  } catch (error) {
    console.error("Error publishing to queue:", error);
    return res.status(500).json({ error: "Error queuing data" });
  }
};

exports.getData = async (req, res) => {
  if (!req.params.id || !req.query.start_time) {
    return res.status(400).json({ error_message: "Missing required query parameters" });
  }

  // Set headers for SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  let lastTimestamp = new Date(req.query.start_time); // Initialize lastTimestamp with start_time

  const interval = setInterval(async () => {
    try {
      const BUFFER_MS = 1000; // 1 second buffer
      // Quick explanation: I used a time buffer to make sure we don’t miss any data
      // since it is being sent through RabbitMQ before it reaches the database.

      // Fetch new data entries since lastTimestamp minus buffer
      const dataEntries = await prisma.TimeSeries.findMany({
        where: {
          deviceId: Number(req.params.id),
          timestamp: {
            gte: new Date(lastTimestamp.getTime() - BUFFER_MS),
          },
        },
        orderBy: {
          timestamp: 'asc',
        },
      });

      if (dataEntries.length > 0) {
        // Update lastTimestamp to the timestamp of the last entry sent
        lastTimestamp = new Date(dataEntries[dataEntries.length - 1].timestamp);
        // Send data entries to client
        res.write(`data: ${JSON.stringify(dataEntries)}\n\n`);
      } else {
        // No new data, send empty array
        res.write(`data: ${JSON.stringify([])}\n\n`);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      res.write(`event: error\ndata: ${JSON.stringify({ error: 'Failed to fetch data' })}\n\n`);
    }
  }, 1000); // Poll every second

  req.on("close", () => {
    clearInterval(interval);
    console.log("SSE connection closed for device", req.params.id);
  });
};

exports.getDataCountLast24h = async (req, res) => {
  try {
    // Calculate timestamps for now and 24 hours ago
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setHours(now.getHours() - 24);

    // Count entries in the last 24 hours
    const count = await prisma.TimeSeries.count({
      where: {
        timestamp: {
          gte: yesterday,
          lte: now,
        },
      },
    });

    return res.status(200).json({ data: count });
  } catch (error) {
    console.error("Error fetching data count:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};