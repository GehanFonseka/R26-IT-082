import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const directory = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(directory, "../../../../../.env") });
dotenv.config();

export const env = {
  serviceName: "resume-explanation-model-service",
  port: Number.parseInt(process.env.PORT ?? "4012", 10),
  apiKey: process.env.GEMINI_API_KEY ?? "",
  model: process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite",
  maxInputChars: Number.parseInt(process.env.MAX_INPUT_CHARS ?? "120000", 10),
};
