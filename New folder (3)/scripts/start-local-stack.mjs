import concurrently from "concurrently";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { localDevServices } from "./local-dev-services.mjs";
import { findOccupiedPorts } from "./local-dev-ports.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const services = localDevServices(process.argv.includes("--core"));
try {
  const occupied = await findOccupiedPorts(services);
  if (occupied.length) {
    console.error("Cannot start the local stack: required ports are already in use.");
    console.table(occupied.map(({ name, port }) => ({ service: name, port })));
    console.error("Stop the existing project run with Ctrl+C in its terminal, then run npm run dev again.");
    console.error("If the existing stack is healthy, use http://localhost:5173 and npm run services:check.");
    process.exitCode = 1;
  } else {
    const { result } = concurrently(services.map(({ port, ...command }) => command), {
      cwd: root, prefix: "name", killOthersOn: ["failure", "success"],
    });
    await result.catch(() => { process.exitCode = 1; });
  }
} catch (error) {
  console.error(`Could not check local service ports (${error.code || error.name}).`);
  process.exitCode = 1;
}
