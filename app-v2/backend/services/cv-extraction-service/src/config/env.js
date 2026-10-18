import "dotenv/config";

export const env = {
  serviceName: "cv-extraction-service",
  port: Number.parseInt(process.env.PORT ?? "4001", 10),
  maxFileSize: Number.parseInt(process.env.MAX_FILE_SIZE_BYTES ?? "15728640", 10),
  certificateMaxBytes: Number.parseInt(process.env.CERTIFICATE_MAX_BYTES ?? "12582912", 10),
  certificateDownloadTimeoutMs: Number.parseInt(process.env.CERTIFICATE_DOWNLOAD_TIMEOUT_MS ?? "20000", 10),
  certificateOcrModelUrl: process.env.CERTIFICATE_LOCAL_MODEL_SERVICE_URL ?? "http://localhost:4013",
  certificateOcrTimeoutMs: Number.parseInt(process.env.CERTIFICATE_LOCAL_MODEL_TIMEOUT_MS ?? "200000", 10),
  certificateVerificationEnabled: process.env.CERTIFICATE_VERIFICATION_ENABLED !== "false",
  certificateMatchThreshold: Number.parseFloat(process.env.CERTIFICATE_MATCH_THRESHOLD ?? "0.9"),
  certificateMinOcrConfidence: Number.parseFloat(process.env.CERTIFICATE_OCR_CONFIDENCE ?? "0.85"),
  certificateBrowserTimeoutMs: Math.min(60000, Math.max(1000, Number.parseInt(process.env.CERTIFICATE_BROWSER_TIMEOUT_MS ?? "60000", 10) || 60000)),
  certificateBrowserMaxScreens: Math.min(12, Math.max(1, Number.parseInt(process.env.CERTIFICATE_BROWSER_MAX_SCREENS ?? "8", 10) || 8)),
  certificateBrowserMaxRequests: Math.min(500, Math.max(1, Number.parseInt(process.env.CERTIFICATE_BROWSER_MAX_REQUESTS ?? "256", 10) || 256)),
  certificateBrowserExecutable: process.env.CERTIFICATE_BROWSER_EXECUTABLE_PATH || "",
  certificateBrowserMaxJobs: Math.min(4, Math.max(1, Number.parseInt(process.env.CERTIFICATE_BROWSER_MAX_JOBS ?? "2", 10) || 2)),
  certificateCacheTtlMs: Number.parseInt(process.env.CERTIFICATE_CACHE_TTL_MS ?? "0", 10),
};
