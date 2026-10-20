import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { createServer } from "node:http";
import { prepareOllama, ollamaReady } from "../install-certificate-ollama.mjs";

function fixture(overrides = {}) {
  const calls = [];
  const server = new EventEmitter();
  let stopped = false;
  server.kill = () => { stopped = true; };
  return { calls, get stopped() { return stopped; }, options: {
    root: process.cwd(), platform: "win32", env: {
      OLLAMA_BASE_URL: "http://127.0.0.1:12345", CERTIFICATE_VISION_MODEL: "test-vision",
    },
    find: () => "ollama.exe",
    run: async (command, args, options) => { calls.push({ command, args, options }); },
    launch: (_, args, options) => { calls.push({ args, options }); return server; },
    ready: async () => true, sleep: async () => {}, ...overrides,
  } };
}

test("an existing Ollama server is reused without being stopped", async () => {
  const state = fixture();
  await prepareOllama(state.options);
  assert.equal(state.calls.length, 1);
  assert.deepEqual(state.calls[0].args, ["pull", "test-vision"]);
  assert.equal(state.calls[0].options.env.OLLAMA_HOST, "http://127.0.0.1:12345");
  assert.equal(state.stopped, false);
});

test("a temporary server is stopped even when the model download fails", async () => {
  let checks = 0;
  const state = fixture({ ready: async () => checks++ > 0,
    run: async () => { throw new Error("download failed"); },
  });
  await assert.rejects(prepareOllama(state.options), /download failed/);
  assert.equal(state.calls[0].options.windowsHide, true);
  assert.equal(state.stopped, true);
});

test("a server that never starts fails without trying to download a model", async () => {
  const state = fixture({ ready: async () => false });
  await assert.rejects(prepareOllama(state.options), /did not become ready/);
  assert.equal(state.calls.length, 1);
  assert.equal(state.stopped, true);
});

test("a missing Windows installation is installed before downloading the model", async () => {
  let searches = 0;
  const state = fixture({ find: () => searches++ === 0 ? undefined : "installed-ollama.exe" });
  await prepareOllama(state.options);
  assert.equal(state.calls[0].command, "winget");
  assert.ok(state.calls[0].args.includes("--silent"));
  assert.equal(state.calls[1].command, "installed-ollama.exe");
});

test("an unavailable remote Ollama server does not launch a local replacement", async () => {
  const state = fixture({ ready: async () => false,
    env: { OLLAMA_BASE_URL: "http://example.invalid:11434" },
  });
  await assert.rejects(prepareOllama(state.options), /configured Ollama server is unavailable/);
  assert.equal(state.calls.length, 0);
});

test("readiness requires an Ollama version response, rather than any listening service", async (t) => {
  let status = 200;
  let body = { unrelatedService: true };
  const server = createServer((request, response) => {
    assert.equal(request.url, "/api/version");
    response.writeHead(status, { "content-type": "application/json" });
    response.end(JSON.stringify(body));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const url = `http://127.0.0.1:${server.address().port}`;
  assert.equal(await ollamaReady(url), false);
  body = { version: "test" };
  assert.equal(await ollamaReady(url), true);
  status = 503;
  assert.equal(await ollamaReady(url), false);
});
