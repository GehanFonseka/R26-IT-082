import { spawn } from "node:child_process";

const child = spawn("npm", ["--prefix", "backend/services/attrition-service", "run", "dev"], {
  env: {
    ...process.env,
    ATTRITION_MODEL_SERVICE_URL: "http://127.0.0.1:4008",
    EARLY_ATTRITION_MODEL_SERVICE_URL: "http://127.0.0.1:4011",
  },
  stdio: "inherit",
  shell: true,
});

const stop = (signal) => {
  if (!child.killed) child.kill(signal);
};
process.on("SIGINT", () => stop("SIGINT"));
process.on("SIGTERM", () => stop("SIGTERM"));
child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exitCode = code ?? 1;
});
