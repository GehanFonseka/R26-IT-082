import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { runCommand } from "./setup-process.mjs";
import { prepareOllama } from "./install-certificate-ollama.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");

export async function installCertificate({ root = projectRoot, platform = process.platform,
  env = process.env, run = runCommand, setupOllama = prepareOllama } = {}) {
  dotenv.config({ path: path.join(root, ".env"), processEnv: env });
  dotenv.config({ path: path.join(root, "backend/ai-services/certificate-reader-service/.env"),
    processEnv: env, override: true });
  const service = path.join(root, "backend/ai-services/certificate-reader-service");
  const venv = path.join(root, ".venv-certificate");
  const python = path.join(venv, platform === "win32" ? "Scripts/python.exe" : "bin/python");
  const options = { cwd: root, env };
  console.log("Creating the isolated Python 3.11 certificate environment...");
  await run(platform === "win32" ? "py" : "python3.11",
    [...(platform === "win32" ? ["-3.11"] : []), "-m", "venv", venv], options);
  console.log("Installing certificate OCR/vision dependencies...");
  await run(python, ["-m", "pip", "install", "--upgrade", "pip"], options);
  await run(python, ["-m", "pip", "install", "-r", path.join(service, "requirements.txt")], options);
  if (!env.npm_execpath) throw new Error("Run this installer using npm run install:certificate.");
  console.log("Installing the certificate browser...");
  await run(process.execPath, [env.npm_execpath, "--prefix", "backend/services/cv-extraction-service",
    "exec", "--", "playwright", "install", "--no-shell", "chromium"], options);
  await setupOllama({ root, env, platform, run });
  console.log("Preparing OCR models (internet is required on first installation)...");
  await run(python, [path.join(service, "src/warmup.py")], options);
  console.log("Certificate setup complete. Your .env files were preserved. Start the project with npm run dev.");
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  try { await installCertificate(); }
  catch (error) {
    console.error(`Certificate setup failed: ${error.message}`);
    process.exitCode = 1;
  }
}
