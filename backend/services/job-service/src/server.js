import app from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase } from "./config/mongo.js";

const pause = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const startupRetries = Math.max(1, Number.parseInt(process.env.DATABASE_STARTUP_RETRIES ?? "12", 10) || 12);

const connectWithRetry = async () => {
  for (let attempt = 1; attempt <= startupRetries; attempt += 1) {
    try { return await connectDatabase(); }
    catch (error) {
      if (attempt === startupRetries) throw error;
      console.warn(`${env.serviceName} database unavailable; retrying (${attempt}/${startupRetries - 1})`);
      await pause(Math.min(3000, attempt * 500));
    }
  }
  return null;
};

const start = async () => {
  try {
    await connectWithRetry();
    app.listen(env.port, () => console.log(`${env.serviceName} listening on port ${env.port}`));
  } catch (error) {
    console.error(`${env.serviceName} MongoDB connection failed`, error.name);
    process.exitCode = 1;
  }
};

start();
