import "dotenv/config";

export const env = {
  serviceName: "cv-matching-service",
  port: Number.parseInt(process.env.PORT ?? "4002", 10),
  modelId: process.env.HF_MODEL_ID ?? "Gehan77/cv-match-browser",
  threshold: Number(process.env.MATCHING_THRESHOLD ?? "0.4399277865886688"),
};
