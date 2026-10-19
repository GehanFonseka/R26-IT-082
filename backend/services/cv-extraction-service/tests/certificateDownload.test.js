import test from "node:test";
import assert from "node:assert/strict";
import { normalizeCertificateUrl, isPublicAddress, resolveCertificateAddress } from "../src/utils/certificateAddress.js";
import { downloadCertificate } from "../src/services/certificateDownload.js";

const publicDns = async () => [{ address: "8.8.8.8", family: 4 }];

test("public Udemy certificate pages resolve to the same certificate's official PDF", async () => {
  const id = "UC-d2b9c2b6-8e55-463b-8e02-39be926c95d9";
  const expected = `https://udemy-certificate.s3.amazonaws.com/pdf/${id}.pdf`;
  for (const host of ["udemy.com", "www.udemy.com"]) {
    assert.equal(normalizeCertificateUrl(`https://${host}/certificate/${id}/?utm_source=share`).href, expected);
  }
  assert.equal(normalizeCertificateUrl(`https://udemy.com.example/certificate/${id}/`).hostname, "udemy.com.example");
  assert.equal(normalizeCertificateUrl("https://www.udemy.com/course/python/").hostname, "www.udemy.com");
  let requested;
  const result = await downloadCertificate(`https://www.udemy.com/certificate/${id}/`, {
    resolver: publicDns,
    request: async (url, address) => {
      requested = url.href;
      assert.equal(address.address, "8.8.8.8");
      return { buffer: Buffer.from("%PDF-1.7"), mimeType: "application/pdf" };
    },
  });
  assert.equal(requested, expected);
  assert.equal(result.sourceUrl, expected);
});

test("Google Drive and Docs view links become document URLs without credentials", () => {
  const drive = normalizeCertificateUrl("https://drive.google.com/file/d/example-id/view?usp=sharing&resourcekey=resource");
  assert.equal(drive.pathname, "/uc");
  assert.equal(drive.searchParams.get("id"), "example-id");
  assert.equal(drive.searchParams.get("resourcekey"), "resource");
  assert.equal(normalizeCertificateUrl("https://docs.google.com/document/d/example-id/edit").href, "https://docs.google.com/document/d/example-id/export?format=docx");
  for (const url of ["file:///etc/passwd", "https://user:pass@example.com/document", "http://example.com:8080/doc", "javascript:alert(1)"])
    assert.throws(() => normalizeCertificateUrl(url), (error) => error.statusCode === 400);
});

test("blocks private, loopback, link-local and mapped addresses while allowing public Google addresses", () => {
  for (const address of ["127.0.0.1", "10.0.0.1", "172.16.0.1", "192.168.1.1", "169.254.169.254", "0.0.0.0", "100.64.0.1", "::1", "fc00::1", "fe80::1", "::ffff:127.0.0.1", "::ffff:10.0.0.1"])
    assert.equal(isPublicAddress(address), false, address);
  assert.equal(isPublicAddress("142.251.126.139"), true);
  assert.equal(isPublicAddress("2404:6800:4000:1015::8b"), true);
});

test("rejects DNS responses containing any private address and prefers pinned IPv4", async () => {
  await assert.rejects(resolveCertificateAddress(new URL("https://example.com"), async () => [
    { address: "8.8.8.8", family: 4 }, { address: "127.0.0.1", family: 4 },
  ]), (error) => error.statusCode === 400);
  const pinned = await resolveCertificateAddress(new URL("https://example.com"), async () => [
    { address: "2001:4860:4860::8888", family: 6 }, { address: "8.8.8.8", family: 4 },
  ]);
  assert.equal(pinned.address, "8.8.8.8");
});

test("checks redirects before contacting their destination", async () => {
  let calls = 0;
  await assert.rejects(downloadCertificate("https://example.com/doc", {
    resolver: publicDns,
    request: async (_url, pinned) => { assert.equal(pinned.address, "8.8.8.8"); calls += 1; return { redirect: "http://169.254.169.254/latest/meta-data" }; },
  }), (error) => error.statusCode === 400);
  assert.equal(calls, 1);
});

test("bounds redirect chains and passes a download byte limit and abort signal", async () => {
  let calls = 0;
  await assert.rejects(downloadCertificate("https://example.com/doc", {
    resolver: publicDns, maxBytes: 1024,
    request: async (_url, _pinned, signal, maxBytes) => {
      assert.ok(signal instanceof AbortSignal);
      assert.equal(maxBytes, 1024);
      calls += 1;
      return { redirect: `https://example.com/doc-${calls}` };
    },
  }), /redirects too many times/);
  assert.equal(calls, 5);
});
