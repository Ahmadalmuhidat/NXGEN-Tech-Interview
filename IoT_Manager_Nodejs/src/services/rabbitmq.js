const amqp = require('amqplib');

let channel = null;

async function connectRabbit() {
  if (channel) {
    return channel;
  }

  // Create connection and channel
  const connection = await amqp.connect(process.env.RABBITMQ_URL);
  channel = await connection.createChannel();

  // Ensure the queue exists
  await channel.assertQueue(process.env.RABBITMQ_DATA_QUEUE, { durable: true });
  return channel;
}

async function getChannel() {
  // If channel is not initialized, connect to RabbitMQ
  if (!channel) {
    await connectRabbit();
  }
  return channel;
}

module.exports = { getChannel };