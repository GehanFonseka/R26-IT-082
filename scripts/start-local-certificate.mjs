import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { portIsAvailable } from "./local-dev-ports.mjs";
import { findOllama } from "./setup-process.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(root, ".env") });
dotenv.config({ path: path.join(root, "backend/ai-services/certificate-reader-service/.env"), override: true });
const port = Number.parseInt(process.env.CERTIFICATE_LOCAL_MODEL_PORT || "4013", 10);
if (!await portIsAvailable(port)) {
  console.error(`The certificate reader port ${port} is already in use. Stop its existing run before starting another one.`);
  process.exit(1);
}
const python = path.join(root, ".venv-certificate", process.platform === "win32" ? "Scripts/python.exe" : "bin/python");
if (!existsSync(python)) {
  console.warn("\n[certificate-model] Certificate reader environment (.venv-certificate) is not installed.");
  console.warn(`[certificate-model] Serving fallback on port ${port} (certificate OCR/vision disabled).`);
  console.warn("[certificate-model] To enable certificate verification, install Python 3.11 and run: npm run install:certificate\n");

  const fallback = createServer((req, res) => {
    res.setHeader("content-type", "application/json");
    if (req.url === "/health") {
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        service: "certificate-reader-service",
        status: "degraded",
        configured: false,
        workerReady: false,
        message: "Certificate reader not installed. Run npm run install:certificate."
      }));
    } else {
      res.writeHead(503);
      res.end(JSON.stringify({
        success: false,
        message: "The local certificate reader is not installed. To enable this feature, install Python 3.11 and run npm run install:certificate."
      }));
    }
  });

  fallback.listen(port, "127.0.0.1", () => {
    console.log(`[certificate-model] Fallback certificate service listening on port ${port}`);
  });

  const cleanup = () => { fallback.close(); process.exit(0); };
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
} else {
const ollama = findOllama(root) || "ollama";
let inference;
try {
  await fetch(process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434", { signal: AbortSignal.timeout(1000) });
} catch {
  if (process.platform !== "win32" || existsSync(ollama)) {
    inference = spawn(ollama, ["serve"], { windowsHide: true, stdio: "ignore",
      env: { ...process.env, OLLAMA_HOST: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434" } });
    inference.on("error", () => console.warn("Ollama could not start; OCR remains available."));
  }
}
const server = spawn(python, [path.join(root, "backend/ai-services/certificate-reader-service/src/server.py")], {
  cwd: root, windowsHide: true, stdio: "inherit", env: { ...process.env, PYTHONUNBUFFERED: "1" },
});
const cleanup = () => { server.kill(); inference?.kill(); };
process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
server.on("exit", (code) => { inference?.kill(); process.exit(code || 0); });
}

