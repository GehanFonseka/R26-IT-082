import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { installCertificate } from "../install-certificate.mjs";
import { runCommand } from "../setup-process.mjs";

async function workspace(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "certificate setup "));
  t.after(() => {
    assert.equal(path.dirname(path.resolve(root)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(root).startsWith("certificate setup "));
    return rm(root, { recursive: true, force: true });
  });
  return root;
}

test("ZIP installation preserves .env and keeps certificate packages out of the main environment", async (t) => {
  const root = await workspace(t);
  const contents = "CERTIFICATE_VISION_MODEL=zip-test-model\n";
  await writeFile(path.join(root, ".env"), contents);
  const calls = [];
  const env = { npm_execpath: path.join(root, "npm cli", "npm-cli.js") };
  await installCertificate({ root, platform: "win32", env,
    run: async (command, args) => { calls.push({ command, args }); },
    setupOllama: async ({ env: settings }) => {
      assert.equal(settings.CERTIFICATE_VISION_MODEL, "zip-test-model");
      calls.push({ command: "vision-setup", args: [] });
    },
  });
  assert.equal(await readFile(path.join(root, ".env"), "utf8"), contents);
  const python = path.join(root, ".venv-certificate", "Scripts/python.exe");
  assert.equal(calls.filter(({ args }) => args.includes("pip")).length, 2);
  assert.ok(calls.filter(({ args }) => args.includes("pip")).every(({ command }) => command === python));
  const browser = calls.find(({ args }) => args.includes("playwright"));
  assert.equal(browser.command, process.execPath);
  assert.equal(browser.args[0], env.npm_execpath);
  assert.equal(calls.at(-1).command, python);
  assert.ok(calls.at(-1).args[0].endsWith("warmup.py"));
});

test("a failed dependency installation stops before browser or model downloads", async (t) => {
  const root = await workspace(t);
  let modelsCalled = false;
  const failure = new Error("package installation failed");
  await assert.rejects(installCertificate({ root, env: { npm_execpath: "npm-cli.js" },
    run: async (_, args) => { if (args.includes("-r")) throw failure; },
    setupOllama: async () => { modelsCalled = true; },
  }), (error) => error === failure);
  assert.equal(modelsCalled, false);
});

test("subprocess failures are reported as installation failures", async () => {
  await assert.rejects(runCommand(process.execPath, ["-e", "process.exit(17)"]), /exit 17/);
  await assert.rejects(runCommand("missing-certificate-setup-executable", []), /could not start/);
});
