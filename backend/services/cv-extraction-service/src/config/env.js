import "dotenv/config";

export const env = {
  serviceName: "cv-extraction-service",
  port: Number.parseInt(process.env.PORT ?? "4001", 10),
  maxFileSize: Number.parseInt(process.env.MAX_FILE_SIZE_BYTES ?? "15728640", 10),
};
