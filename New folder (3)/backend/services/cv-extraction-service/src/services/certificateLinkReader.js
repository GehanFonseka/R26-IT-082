import { createHash } from "node:crypto";
import { env } from "../config/env.js";
import { downloadCertificate } from "./certificateDownload.js";
import { readCertificateDocument } from "./certificateDocument.js";

const cache = new Map();
export async function readCertificateLink(url, requestId, options = {}) {
  const file = await (options.download || downloadCertificate)(url);
  const key = createHash("sha256").update(url).update(options.modelPurpose || "certificate").update(file.buffer).digest("hex");
  const previous = cache.get(key);
  if (env.certificateCacheTtlMs > 0 && previous?.expires > Date.now()) return previous.document;
  const document = await (options.read || readCertificateDocument)(file, requestId, { ...options, includeEvidence: true });
  if (env.certificateCacheTtlMs > 0 && document.scanComplete !== false) {
    for (const [entry, value] of cache) if (value.expires <= Date.now()) cache.delete(entry);
    if (cache.size >= 4) cache.delete(cache.keys().next().value);
    cache.set(key, { document, expires: Date.now() + env.certificateCacheTtlMs });
  }
  return document;
}
