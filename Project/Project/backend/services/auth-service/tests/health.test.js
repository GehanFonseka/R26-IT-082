import test from "node:test";
import assert from "node:assert/strict";
import app from "../src/app.js";
test("auth health works", async () => {
  const server = app.listen(0);
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/health`);
    const body = await response.json();
    assert.equal(response.status, 200); assert.equal(body.service, "auth-service");
    assert.ok(body.requestId);
  } finally { server.close(); }
});
