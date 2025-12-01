const { getChannel } = require("../services/rabbitmq");
const prisma = require("./prismaClient");

async function startConsumer() {
  const channel = await getChannel(); // Get RabbitMQ channel

  channel.consume(process.env.RABBITMQ_DATA_QUEUE, async (msg) => {
    const data = JSON.parse(msg.content.toString());
    try {
      // Store data in the database
      await prisma.TimeSeries.create({
        data: {
          deviceId: data.deviceId,
          value: data.value,
          timestamp: new Date(data.timestamp)
        }
      });

      channel.ack(msg); // Acknowledge message only after successful DB operation
    } catch (error) {
      console.error("DB Failed → Message not acked:", error);
    }
  });

  console.log("Consumer running...");
}

startConsumer();