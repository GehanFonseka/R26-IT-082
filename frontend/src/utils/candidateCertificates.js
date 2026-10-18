export const certificateUrl = (value) => {
  try {
    const text = String(value || "").trim();
    const url = new URL(text.startsWith("www.") ? `https://${text}` : text);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password ? url.href : "";
  } catch { return ""; }
};

export const certificateLinks = (certificate = {}) => [...new Set([
  certificate.url, ...(Array.isArray(certificate.urls) ? certificate.urls : []),
].map(certificateUrl).filter(Boolean))].slice(0, 10);

const assignLinks = (entry, values) => {
  const urls = certificateLinks({ url: entry.url, urls: [...(entry.urls || []), ...values] });
  entry.url = urls[0] || "";
  if (urls.length > 1) entry.urls = urls;
};

export const certificateEntries = (names = "", details = []) => {
  const records = Array.isArray(details) ? details : [];
  const entries = [];
  for (const value of (Array.isArray(names) ? names : String(names || "").split(/;\s*/))) {
    const text = String(value || "").trim();
    const match = text.match(/(?:https?:\/\/|www\.)[^\s<>"\]]+/i);
    const url = certificateUrl(match?.[0]?.replace(/[.,;:)\]}]+$/, ""));
    const name = text.replace(match?.[0] || /$^/, "").replace(/[\s|:()\-–—]+$/, "").trim();
    if (!name || /^(?:link|url|credential\s+url|view\s+certificate)\s*:?$/i.test(name)) {
      if (url && entries.length) assignLinks(entries.at(-1), [url]);
      continue;
    }
    const saved = records.filter((entry) => entry?.name?.toLowerCase() === name.toLowerCase());
    const entry = { name, url: "" };
    assignLinks(entry, [url, ...saved.flatMap(certificateLinks)]);
    entries.push(entry);
  }
  return entries.filter((entry, index) => entries.findIndex((other) => other.name === entry.name && other.url === entry.url) === index).slice(0, 20);
};
