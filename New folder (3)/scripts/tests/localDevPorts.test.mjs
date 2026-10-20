import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:net";
import { portIsAvailable, findOccupiedPorts } from "../local-dev-ports.mjs";
import { localDevServices } from "../local-dev-services.mjs";

test("detects an occupied port without interrupting its existing server", async (t) => {
  const server = createServer((socket) => socket.end());
  await new Promise((resolve) => server.listen(0, resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const port = server.address().port;
  assert.equal(await portIsAvailable(port), false);
  const occupied = await findOccupiedPorts([{ name: "existing service", port }]);
  assert.equal(occupied[0].name, "existing service");
  assert.ok(server.listening);
});

test("releases the socket used to check a free port", async () => {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  assert.equal(await portIsAvailable(port), true);
  assert.equal(await portIsAvailable(port), true);
});

test("detects a service listening only on IPv4 loopback", async (t) => {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  assert.equal(await portIsAvailable(server.address().port), false);
});

test("full and core starts check every service they launch, including certificates", () => {
  const full = localDevServices();
  const core = localDevServices(true);
  assert.equal(full.length, 17);
  assert.equal(new Set(full.map(({ port }) => port)).size, full.length);
  assert.ok(core.some(({ name, port }) => name === "certificate-model" && port === 4013));
  assert.ok(!core.some(({ name }) => name === "answer-model"));
});
