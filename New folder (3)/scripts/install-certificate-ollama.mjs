import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { findOllama, runCommand } from "./setup-process.mjs";

export async function ollamaReady(baseUrl) {
  try {
    const response = await fetch(new URL("/api/version", baseUrl), {
      signal: AbortSignal.timeout(1000),
    });
    return response.ok && typeof (await response.json()).version === "string";
  } catch {
    return false;
  }
}

export async function prepareOllama({ root, env = process.env, platform = process.platform,
  run = runCommand, find = findOllama, launch = spawn, ready = ollamaReady, sleep = delay }) {
  const baseUrl = env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
  const model = env.CERTIFICATE_VISION_MODEL || "qwen3-vl:2b";
  const url = new URL(baseUrl);
  let command = find(root, platform, env);
  if (!command) {
    if (platform !== "win32") {
      throw new Error("Install Ollama from https://ollama.com/download and retry npm run install:certificate.");
    }
    console.log("Installing Ollama for Windows...");
    await run("winget", ["install", "--id", "Ollama.Ollama", "--exact", "--silent",
      "--accept-package-agreements", "--accept-source-agreements", "--disable-interactivity"], { cwd: root, env });
    command = find(root, platform, env);
    if (!command) throw new Error("Ollama was not found after installation. Reopen the terminal and retry.");
  }
  const ollamaEnv = { ...env, OLLAMA_HOST: url.origin };
  let server;
  let launchError;
  const cleanup = () => { server?.kill(); };
  const interrupted = () => { cleanup(); process.exit(130); };
  process.once("SIGINT", interrupted);
  process.once("SIGTERM", interrupted);
  try {
    if (!await ready(baseUrl)) {
      if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
        throw new Error("The configured Ollama server is unavailable. Start it and retry installation.");
      }
      console.log("Starting Ollama for model installation...");
      server = launch(command, ["serve"], {
        cwd: root, env: ollamaEnv, windowsHide: true, stdio: "ignore",
      });
      server.once("error", () => { launchError = true; });
      let available = false;
      for (let attempt = 0; attempt < 60 && !launchError; attempt += 1) {
        if (await ready(baseUrl)) { available = true; break; }
        await sleep(1000);
      }
      if (!available) throw new Error("Ollama did not become ready. Check its installation and configured port, then retry.");
    }
    console.log("Downloading/checking the configured certificate vision model...");
    await run(command, ["pull", model], { cwd: root, env: ollamaEnv });
  } finally {
    cleanup();
    process.removeListener("SIGINT", interrupted);
    process.removeListener("SIGTERM", interrupted);
  }
}
