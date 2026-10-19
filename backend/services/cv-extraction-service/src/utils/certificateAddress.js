import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";

const blocked = new BlockList();
for (const [address, prefix] of [["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.168.0.0", 16], ["192.0.0.0", 24], ["198.18.0.0", 15], ["224.0.0.0", 3]]) blocked.addSubnet(address, prefix, "ipv4");
for (const [address, prefix] of [["::", 128], ["::1", 128], ["fc00::", 7], ["fe80::", 10], ["ff00::", 8]]) blocked.addSubnet(address, prefix, "ipv6");
const invalid = () => Object.assign(new Error("Certificate links must point to a public HTTP or HTTPS document."), { statusCode: 400 });

export const normalizeCertificateUrl = (value) => {
  let url;
  try { url = new URL(value); } catch { throw invalid(); }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.port) throw invalid();
  if (["www.udemy.com", "udemy.com"].includes(url.hostname)) {
    const id = url.pathname.match(/^\/certificate\/(UC-[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12})\/?$/i)?.[1];
    if (id) url = new URL(`https://udemy-certificate.s3.amazonaws.com/pdf/${id}.pdf`);
  }
  if (url.hostname === "drive.google.com") {
    const id = url.pathname.match(/\/file\/d\/([\w-]+)/)?.[1] || url.searchParams.get("id");
    if (id && /^[\w-]+$/.test(id)) {
      const direct = new URL("https://drive.google.com/uc");
      direct.searchParams.set("export", "download");
      direct.searchParams.set("id", id);
      if (url.searchParams.has("resourcekey")) direct.searchParams.set("resourcekey", url.searchParams.get("resourcekey"));
      url = direct;
    }
  }
  if (url.hostname === "docs.google.com" && /^\/document\/d\/[\w-]+/.test(url.pathname)) {
    url.pathname = url.pathname.match(/^\/document\/d\/[\w-]+/)[0] + "/export";
    url.search = "format=docx";
  }
  url.hash = "";
  return url;
};

export const isPublicAddress = (address) => {
  const family = isIP(address);
  return Boolean(family) && !blocked.check(address, family === 4 ? "ipv4" : "ipv6");
};

export async function resolveCertificateAddress(url, resolver = lookup) {
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  const addresses = isIP(hostname) ? [{ address: hostname, family: isIP(hostname) }] : await resolver(hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some((entry) => !isPublicAddress(entry.address))) throw invalid();
  return addresses.find((entry) => entry.family === 4) || addresses[0];
}
