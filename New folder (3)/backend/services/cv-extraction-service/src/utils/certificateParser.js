const certificateHeading = /^(?:(?:professional|relevant|industry|technical)\s+)?(?:certifications?|certificates?|licenses?|credentials?)(?:\s*(?:&|and)\s*(?:certifications?|certificates?|licenses?|credentials?))?\s*[:\-]?\s*$/i;
const nextHeading = /^(?:(?:professional|work|technical|core|key|academic|personal|selected|relevant|extracurricular)\s+)?(?:experience|education|skills?|projects?|summary|profile|references?|languages?|interests?|awards?|achievements?|employment\s+history|leadership(?:\s*(?:&|and)\s*activities)?|activities)\s*[:\-]?\s*$/i;
const urlPattern = /(?:https?:\/\/|www\.)[^\s<>"\])]+/gi;
const clean = (value) => value.replace(/^[\s#*•●▪\-–—]+/, "").trim();
const linkLabel = /^(?:(?:view|verify|verification|credential\s+id|issued|issuer|date|expires?)\b[\s\S]*|(?:certificate|certification|credential|link|url))$/i;

const safeUrl = (value) => {
  try {
    const url = new URL(value.startsWith("www.") ? `https://${value}` : value);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password ? url.href : "";
  } catch { return ""; }
};

const setLinks = (entry, values) => {
  const urls = [...new Set([entry.url, ...(entry.urls || []), ...values].filter(Boolean))].slice(0, 10);
  entry.url = urls[0] || "";
  if (urls.length > 1) entry.urls = urls;
};

export function parseCertificateEntries(lines = []) {
  const entries = [];
  for (const rawLine of lines.flatMap((line) => String(line).split(/;\s+(?!https?:\/\/)/))) {
    const line = clean(rawLine).replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, "$1 $2");
    if (!line || /^(?:javascript|data|file):/i.test(line)) continue;
    const urls = [...line.matchAll(urlPattern)].map(([url]) => safeUrl(url.replace(/[.,;:)\]}]+$/, ""))).filter(Boolean);
    const name = clean(line.replace(urlPattern, "").replace(/\[([^\]]+)\]\(\s*\)/g, "$1")
      .replace(/\(\s*\)/g, "")
      .replace(/\(\s*(?:certificate|credential|verification|view\s+certificate)(?:\s*[-–—]\s*(?:19|20)\d{2})?\s*\)/gi, "")
      .replace(/\b(?:credential\s+url|certificate\s+link|verification\s+link|https?|url|link)\s*:?\s*$/i, "")
      .replace(/^(?:certificate\s+name|certification\s+name|name|title)\s*:\s*/i, "").replace(/[\s|:()\-–—]+$/, ""));
    if (name && !linkLabel.test(name) && !/^(?:19|20)\d{2}(?:\s*[-–—]\s*(?:\d{4}|present))?$/i.test(name)) {
      const entry = { name: name.slice(0, 180), url: "" };
      setLinks(entry, urls);
      entries.push(entry);
    } else if (urls.length && entries.length) {
      setLinks(entries.at(-1), urls);
    }
  }
  return entries.filter((entry, index) => entries.findIndex((other) => other.name.toLowerCase() === entry.name.toLowerCase() && other.url === entry.url) === index).slice(0, 20);
}

export function extractCertificates(text) {
  const lines = [];
  let active = false;
  for (const rawLine of String(text || "").split(/\r?\n/)) {
    const line = clean(rawLine);
    const inline = line.match(/^((?:(?:professional|relevant|industry|technical)\s+)?(?:certifications?|certificates?|licenses?|credentials?))\s*:\s*(.+)$/i);
    if (certificateHeading.test(line) || inline) {
      active = true;
      if (inline) lines.push(...inline[2].split(/;\s*/));
      continue;
    }
    if (nextHeading.test(line)) active = false;
    if (active) lines.push(line);
  }
  return parseCertificateEntries(lines);
}
