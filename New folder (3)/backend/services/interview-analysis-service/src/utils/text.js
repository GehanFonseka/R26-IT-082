const stopWords = new Set("a an the and or but for with from into about this that have has had are was were is be to of in on at by as it its i we you they their our your how what why when where do does did can could would should tell explain describe please".split(" "));

export const normalizeText = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
export const words = (value) => normalizeText(value).toLowerCase().match(/[a-z][a-z0-9+#]*(?:[.-][a-z0-9+#]+)*/g) || [];
export const meaningfulWords = (value) => words(value).filter((word) => word.length > 2 && !stopWords.has(word));
export const unique = (items) => [...new Set(items.filter(Boolean))];
export const sentenceParts = (value) => normalizeText(value).split(/(?<=[.!?;])\s+|[\n;]/).map(normalizeText).filter(Boolean);

export const overlapScore = (left, right) => {
  const first = new Set(meaningfulWords(left));
  const second = new Set(meaningfulWords(right));
  if (!first.size || !second.size) return 0;
  const shared = [...first].filter((word) => second.has(word)).length;
  return shared / Math.max(first.size, second.size);
};

export const percent = (value) => Math.max(0, Math.min(100, Math.round(Number(value || 0) * 100)));
