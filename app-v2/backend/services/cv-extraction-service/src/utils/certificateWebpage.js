import { parseDocument } from "htmlparser2";
import { certificateRecipient } from "./certificateNames.js";

const excluded = new Set(["script", "style", "head", "nav", "header", "footer", "form", "noscript", "aside", "template"]);
const blocks = new Set(["p", "div", "section", "article", "main", "li", "tr", "dt", "dd", "br", "h1", "h2", "h3", "h4", "h5", "h6"]);
const certificateCue = /\b(?:certificate|certification|credential|diploma|badge)\b/i;
const recipientCue = /^\s*(?:(?:(?:course\s+)?completed\s+by|earned\s+by|congratulations\s+to|this\s+is\s+to\s+certify\s+that|(?:(?:this\s+)?(?:certificate|badge|credential)\s+(?:was\s+)?)?(?:awarded|presented|issued)\s+to)\b|(?:(?:certificate\s+)?recipient(?:\s+name)?\b|credential\s+holder\s*:))/i;
const textOf = (node) => node.type === "text" ? node.data : (node.children || []).map(textOf).join("");

const structuredRecipient = (value, depth = 0) => {
  if (!value || depth > 4) return "";
  if (Array.isArray(value)) return value.slice(0, 100).map((item) => structuredRecipient(item, depth + 1)).find(Boolean) || "";
  if (typeof value !== "object") return "";
  const types = [].concat(value["@type"] || []);
  if (types.some((type) => /^(?:EducationalOccupationalCredential|Certificate|Certification)$/.test(type))) {
    const subject = value.credentialSubject || value.recipient || value.awardedTo;
    const name = typeof subject === "string" ? subject : subject?.name;
    if (typeof name === "string") return certificateRecipient(`Recipient name: ${name}`);
  }
  return structuredRecipient(value["@graph"], depth + 1);
};

export function parseCertificateWebpage(html, sourceUrl = "") {
  const document = parseDocument(html, { decodeEntities: true });
  const pieces = [];
  const assets = [];
  const captions = [];
  let structuredName = "";
  let title = "";
  const metadata = [...document.children];
  while (metadata.length) {
    const node = metadata.pop();
    if (node.name === "title") title = textOf(node);
    if (node.name === "script" && String(node.attribs?.type).toLowerCase() === "application/ld+json") {
      try { structuredName ||= structuredRecipient(JSON.parse(textOf(node))); } catch { /* Unreadable metadata is ignored. */ }
    }
    metadata.push(...(node.children || []));
  }
  const visit = (node) => {
    if (node.type === "text") { pieces.push(node.data); return; }
    const tag = node.name;
    const attributes = node.attribs || {};
    const certificateSidebar = tag === "aside" && /\bcertificate\s+recipient\b/i.test(textOf(node));
    if ((excluded.has(tag) && !certificateSidebar) || Object.hasOwn(attributes, "hidden") || attributes["aria-hidden"] === "true"
      || /(?:display\s*:\s*none|visibility\s*:\s*hidden)/i.test(attributes.style || "")) return;
    const candidate = tag === "a" ? attributes.href : ["img", "embed", "iframe", "object"].includes(tag) ? attributes.src || attributes["data-src"] || attributes.data : "";
    const label = candidate ? [attributes.alt, attributes.title, attributes.class, attributes.id, textOf(node).slice(0, 200)].filter(Boolean).join(" ") : "";
    if (candidate && (certificateCue.test(label) || certificateCue.test(candidate) || /\.(?:pdf|docx)(?:[?#]|$)/i.test(candidate))) {
      try {
        const url = new URL(candidate, sourceUrl);
        if (["http:", "https:"].includes(url.protocol)) assets.push(url.href);
      } catch { /* A missing base URL or invalid asset is ignored. */ }
    }
    if (tag === "img" && attributes.alt) {
      const match = attributes.alt.match(/^(?:view\s+)?certificate\s+for\s+([^,]+)(?:,|$)/i);
      if (match) captions.push(`Recipient name: ${match[1]}`);
    }
    if (blocks.has(tag)) pieces.push("\n");
    for (const child of node.children || []) visit(child);
    if (blocks.has(tag)) pieces.push("\n");
  };
  for (const child of document.children) visit(child);
  const text = pieces.join("").replace(/[^\S\r\n]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n").trim().slice(0, 30000);
  const lines = text.split("\n").filter(Boolean);
  const preferred = lines.flatMap((line, index) => recipientCue.test(line) ? [line, lines[index + 1] || ""] : []).join("\n");
  const hasCertificate = certificateCue.test(`${title}\n${text}`) || Boolean(structuredName) || captions.length > 0;
  const recipientName = hasCertificate ? certificateRecipient(preferred) || structuredName || certificateRecipient(captions.join("\n")) : "";
  return { recipientName, documentUrls: [...new Set(assets)].slice(0, 3) };
}
