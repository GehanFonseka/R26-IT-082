import { distance } from "fastest-levenshtein";
import { env } from "../config/env.js";

export const normalizedContent = (text) => String(text || "").normalize("NFKC").toLowerCase()
  .replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/\s+/g, " ").trim();
const escaped = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const contains = (text, target) => new RegExp(`(?<![\\p{L}\\p{N}])${escaped(target)}(?![\\p{L}\\p{N}])`, "u").test(text);

export function matchContent(text, target, strict = false) {
  if (contains(text, target)) return { found: true, matchType: "exact", matchedText: target, similarity: 1 };
  if (strict) return { found: false, matchType: "none", matchedText: "", similarity: 0 };
  const normalized = normalizedContent(target);
  if (contains(normalizedContent(text), normalized)) return { found: true, matchType: "normalized", matchedText: target, similarity: 1 };
  const words = normalizedContent(text).split(" ").slice(0, 10000);
  const length = normalized.split(" ").length;
  let best = { found: false, matchType: "none", matchedText: "", similarity: 0 };
  for (let index = 0; index <= words.length - length; index += 1) {
    const candidate = words.slice(index, index + length).join(" ").slice(0, 500);
    const similarity = 1 - distance(normalized, candidate) / Math.max(normalized.length, candidate.length, 1);
    if (similarity >= env.certificateMatchThreshold && similarity > best.similarity) {
      best = { found: null, matchType: "fuzzy", matchedText: candidate, similarity };
    }
  }
  return best;
}
