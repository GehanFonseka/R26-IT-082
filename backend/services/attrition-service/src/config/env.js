import "dotenv/config";
export const env = {
  serviceName: "attrition-service",
  port: Number.parseInt(process.env.PORT ?? "4003", 10),
  modelServiceUrl: process.env.ATTRITION_MODEL_SERVICE_URL ?? "",
  earlyModelServiceUrl: process.env.EARLY_ATTRITION_MODEL_SERVICE_URL ?? "",
  modelTimeoutMs: Number.parseInt(process.env.ATTRITION_MODEL_TIMEOUT_MS ?? "120000", 10),
  explanationServiceUrl: process.env.ATTRITION_EXPLANATION_MODEL_SERVICE_URL ?? "http://localhost:4012",
  explanationTimeoutMs: Number.parseInt(process.env.ATTRITION_EXPLANATION_TIMEOUT_MS ?? "30000", 10),
};
