import http from "node:http";
import https from "node:https";
import { createGunzip, createInflate, createBrotliDecompress } from "node:zlib";
import { certificateGraphqlBody } from "./certificateGraphql.js";

export const readCertificateResponse = (url, address, signal, maxBytes, options = {}) => new Promise((resolve, reject) => {
  const transport = url.protocol === "https:" ? https : http;
  const publicCertificateId = url.hostname === "learn.mongodb.com" && url.pathname === "/graphql" ? options.publicCertificateId : "";
  const body = options.graphqlBody ? certificateGraphqlBody(options.graphqlBody, publicCertificateId) : null;
  if (options.graphqlBody && !body) return reject(new Error("Only GraphQL query operations may be read."));
  const request = transport.request(url, {
    signal,
    method: body ? "POST" : "GET",
    headers: { accept: options.accept || "application/pdf, image/*, application/vnd.openxmlformats-officedocument.wordprocessingml.document, text/html, text/plain, */*",
      "accept-encoding": "gzip, deflate, br",
      ...(body ? { "content-type": "application/json", "content-length": Buffer.byteLength(body),
        ...(options.nonce ? { nonce: options.nonce } : {}) } : {}),
      ...Object.fromEntries([["user-agent", options.userAgent], ["origin", options.origin],
        ["accept-language", options.acceptLanguage], ["x-requested-with", options.requestedWith]].filter(([, value]) => value)) },
    lookup: (_hostname, options, callback) => options.all ? callback(null, [address]) : callback(null, address.address, address.family),
  }, (response) => {
    if ([301, 302, 303, 307, 308].includes(response.statusCode) && response.headers.location) {
      response.resume();
      if (body) return reject(new Error("The certificate query endpoint redirected and could not be read."));
      resolve({ redirect: new URL(response.headers.location, url).href });
      return;
    }
    if (response.statusCode !== 200) {
      response.resume();
      reject(new Error("The certificate document is unavailable or requires permission to view."));
      return;
    }
    if (Number(response.headers["content-length"]) > maxBytes) {
      response.destroy();
      reject(new Error("The linked certificate document is too large to read."));
      return;
    }
    const chunks = [];
    let size = 0;
    const decoder = new Map([["gzip", createGunzip], ["deflate", createInflate], ["br", createBrotliDecompress]]).get(String(response.headers["content-encoding"]).toLowerCase());
    const stream = decoder ? response.pipe(decoder()) : response;
    stream.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        response.destroy();
        stream.destroy();
        reject(new Error("The linked certificate document is too large to read."));
      } else chunks.push(chunk);
    });
    stream.on("end", () => resolve({ buffer: Buffer.concat(chunks),
      browserHeaders: Object.fromEntries(["access-control-allow-origin", "access-control-allow-credentials", "access-control-expose-headers"]
        .filter((name) => typeof response.headers[name] === "string").map((name) => [name, response.headers[name]])),
      mimeType: String(response.headers["content-type"] || "").split(";")[0].toLowerCase() }));
    stream.on("error", reject);
    response.on("error", reject);
  });
  request.on("error", () => reject(new Error("The certificate document could not be downloaded. Check its sharing permissions or try again.")));
  request.end(body || undefined);
});
