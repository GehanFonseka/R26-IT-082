import { parse, getOperationAST, Kind } from "graphql";

export function certificateGraphqlBody(body, publicCertificateId = "") {
  if (typeof body !== "string" || Buffer.byteLength(body) > 65536) return null;
  try {
    const payload = JSON.parse(body);
    const operations = Array.isArray(payload) ? payload : [payload];
    if (!operations.length || operations.length > 8) return null;
    for (const item of operations) {
      if (!item || typeof item !== "object") return null;
      if (item.variables != null && (typeof item.variables !== "object" || Array.isArray(item.variables))) return null;
      // MongoDB University uses opaque, server-persisted public read operations.
      // Limit them to this page's credential and the public language selector.
      if (publicCertificateId && typeof item.token === "string" && item.token.length > 0 && item.token.length <= 16000
        && Object.keys(item).every((key) => ["token", "operationName", "variables"].includes(key))) {
        if (item.operationName === "PublicCertificateQuery" && item.variables?.id === publicCertificateId
          && Object.keys(item.variables).length === 1) continue;
        if (item.operationName === "LanguagesQuery" && Object.keys(item.variables || {}).length === 0) continue;
      }
      if (typeof item.query !== "string" || !Object.keys(item).every((key) => ["query", "operationName", "variables"].includes(key))) return null;
      const document = parse(item.query, { maxTokens: 10000 });
      if (document.definitions.some((definition) => definition.kind !== Kind.FRAGMENT_DEFINITION
        && (definition.kind !== Kind.OPERATION_DEFINITION || definition.operation !== "query"))) return null;
      if (getOperationAST(document, item.operationName)?.operation !== "query") return null;
    }
    return JSON.stringify(payload);
  } catch { return null; }
}
