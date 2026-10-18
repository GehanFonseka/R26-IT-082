import { env } from "../config/env.js";
import { normalizeCertificateUrl, resolveCertificateAddress } from "../utils/certificateAddress.js";
import { readCertificateResponse } from "../utils/certificateHttp.js";

export async function downloadCertificate(source, options = {}) {
  const signal = AbortSignal.timeout(options.timeoutMs || env.certificateDownloadTimeoutMs);
  let url = normalizeCertificateUrl(source);
  for (let redirects = 0; redirects <= 4; redirects += 1) {
    const address = await resolveCertificateAddress(url, options.resolver);
    const result = await (options.request || readCertificateResponse)(url, address, signal, options.maxBytes || env.certificateMaxBytes,
      { userAgent: options.userAgent, origin: options.origin, accept: options.accept,
        acceptLanguage: options.acceptLanguage, requestedWith: options.requestedWith, graphqlBody: options.graphqlBody,
        publicCertificateId: options.publicCertificateId, nonce: options.nonce });
    if (!result.redirect) return { ...result, sourceUrl: url.href, requestUserAgent: options.userAgent || "" };
    url = normalizeCertificateUrl(result.redirect);
  }
  throw new Error("The certificate link redirects too many times. Use a direct document link.");
}
