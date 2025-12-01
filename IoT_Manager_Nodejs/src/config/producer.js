const { getChannel } = require("../services/rabbitmq");

async function publishToQueue(message) {
  try {
    const channel = await getChannel(); // Get RabbitMQ channel
    await channel.assertQueue(
      process.env.RABBITMQ_DATA_QUEUE,
      {
        durable: true
      }); // Ensure queue exists

    // Publish message to the queue
    channel.sendToQueue(
      process.env.RABBITMQ_DATA_QUEUE,
      Buffer.from(JSON.stringify(message)),
      {
        persistent: true,
      }
    );
  } catch (error) {
    console.error("Publishing failed:", error);
  }
}

module.exports = { publishToQueue };