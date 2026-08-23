import app from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase } from "./config/mongo.js";

const start = async () => {
  try {
    await connectDatabase();
    app.listen(env.port, () => console.log(`${env.serviceName} listening on port ${env.port}`));
  } catch (error) {
    console.error(`${env.serviceName} MongoDB connection failed`, error.name);
    process.exitCode = 1;
  }
};

start();
