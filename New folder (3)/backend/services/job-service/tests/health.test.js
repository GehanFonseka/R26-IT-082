import test from "node:test";
import assert from "node:assert/strict";
import app from "../src/app.js";
import { validateRoomDescription } from "../src/validation/jobValidation.js";

test("job service health works", async () => {
  const server = app.listen(0);
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/health`);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.service, "job-service");
  } finally { server.close(); }
});

test("normalizes WebRTC SDP with a terminating CRLF", () => {
  const result = validateRoomDescription({ sdp: "v=0\r\na=ssrc:123 cname:test" });
  assert.equal(result.sdp, "v=0\r\na=ssrc:123 cname:test\r\n");
});
