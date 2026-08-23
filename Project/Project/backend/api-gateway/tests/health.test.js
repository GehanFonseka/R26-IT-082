import test from "node:test";
import assert from "node:assert/strict";
import app from "../src/app.js";

test("gateway health exposes a request id", async () => {
  const server = app.listen(0);
  const port = server.address().port;
  try {
    const response = await fetch(`http://127.0.0.1:${port}/health`);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.service, "api-gateway");
    assert.ok(response.headers.get("x-request-id"));
  } finally {
    server.close();
  }
});
