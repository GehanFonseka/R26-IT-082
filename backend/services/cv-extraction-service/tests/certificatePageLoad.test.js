import test from "node:test";
import assert from "node:assert/strict";
import { waitForCertificatePageLoad } from "../src/services/certificatePageLoad.js";

test("persistent background traffic does not block loaded certificate text and images", async () => {
  const states = [];
  let checkedImages = false;
  let decodedImages = false;
  const page = {
    waitForLoadState: async (state, options) => {
      states.push(state);
      if (state === "networkidle") {
        assert.equal(options.timeout, 1200);
        throw Object.assign(new Error("Analytics stayed active"), { name: "TimeoutError" });
      }
    },
    waitForFunction: async () => { checkedImages = true; },
    evaluate: async () => { decodedImages = true; },
  };
  await waitForCertificatePageLoad(page, Date.now() + 60000, true);
  assert.deepEqual(states, ["load", "networkidle"]);
  assert(checkedImages && decodedImages);
});

test("navigation errors and an exhausted rendering deadline still fail", async () => {
  const failure = new Error("The page was closed");
  await assert.rejects(waitForCertificatePageLoad({ waitForLoadState: async () => { throw failure; } }, Date.now() + 10000), failure);
  const page = { waitForLoadState: async (state) => {
    if (state === "networkidle") throw Object.assign(new Error("Timed out"), { name: "TimeoutError" });
  } };
  await assert.rejects(waitForCertificatePageLoad(page, Date.now() - 1), { name: "TimeoutError" });
});
