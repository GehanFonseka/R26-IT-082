import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

export function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", windowsHide: true, ...options });
    child.once("error", (error) => reject(new Error(
      `${path.basename(command)} could not start (${error.code || error.name}). Check its installation and PATH.`,
    )));
    child.once("exit", (code, signal) => code === 0 ? resolve() : reject(new Error(
      `${path.basename(command)} failed (${signal || `exit ${code}`}). Fix the error above and retry installation.`,
    )));
  });
}

export function findOllama(root, platform = process.platform, env = process.env) {
  const filename = platform === "win32" ? "ollama.exe" : "ollama";
  const candidates = [
    path.join(root, ".local-ai", "ollama", filename),
    ...(platform === "win32" && env.LOCALAPPDATA
      ? [path.join(env.LOCALAPPDATA, "Programs", "Ollama", filename)] : []),
    ...(env.PATH || env.Path || "").split(platform === "win32" ? ";" : ":")
      .filter(Boolean).map((directory) => path.join(directory.replace(/^"|"$/g, ""), filename)),
  ];
  return candidates.find((candidate) => existsSync(candidate));
}
