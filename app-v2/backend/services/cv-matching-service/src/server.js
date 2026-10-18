import app from "./app.js";
import { env } from "./config/env.js";
import { loadModel, modelStatus } from "./model/model.js";

try {
  await loadModel();
  console.log(`${env.serviceName} loaded ${env.modelId}`);
} catch (error) {
  console.error(`${env.serviceName} model load failed: ${error.message}`);
}

app.listen(env.port, "0.0.0.0", () => console.log(`${env.serviceName} listening on port ${env.port}; modelLoaded=${modelStatus().loaded}`));
