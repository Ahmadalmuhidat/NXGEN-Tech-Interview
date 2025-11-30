import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const deviceId = 88; // device ID

async function insertRandomEntry() {
  const record = {
    deviceId,
    value: Math.random() * 100, // random value
    timestamp: new Date(),
  };

  try {
    await prisma.timeSeries.create({ data: record });
    console.log("Inserted:", record);
  } catch (err) {
    console.error("Insert failed:", err);
  }
}

// Insert one entry every 1 second
const interval = setInterval(insertRandomEntry, 1000);

// Stop after some time (optional, e.g., 60 entries / 1 minute)
setTimeout(() => {
  clearInterval(interval);
  prisma.$disconnect();
  console.log("Simulation stopped.");
}, 60_000);
