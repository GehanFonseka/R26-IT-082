const publicUrl = (value) => /^https?:\/\//i.test(value || "") ? value : "";

export async function renderPdfPage(page) {
  const [content, annotations] = await Promise.all([
    page.getTextContent({ normalizeWhitespace: false, disableCombineTextItems: false }),
    page.getAnnotations(),
  ]);
  const lines = [];
  for (const item of content.items) {
    const y = item.transform[5];
    let line = lines.at(-1);
    if (!line || Math.abs(line.y - y) > 2) {
      line = { y, text: "", items: [] };
      lines.push(line);
    }
    const previous = line.items.at(-1);
    const gap = previous && item.transform[4] - (previous.transform[4] + previous.width);
    line.text += `${gap > 2 ? " " : ""}${item.str}`;
    line.items.push(item);
  }
  for (const annotation of annotations) {
    const url = publicUrl(annotation.url);
    if (!url || !Array.isArray(annotation.rect)) continue;
    const [left, bottom, right, top] = annotation.rect;
    const line = lines.find((entry) => entry.items.some((item) => {
      const x = item.transform[4];
      const y = item.transform[5];
      const height = Math.abs(item.height || item.transform[3] || 10);
      return x <= right && x + item.width >= left && y <= top + 2 && y + height >= bottom - 2;
    }));
    if (line && !line.text.includes(url)) line.text += ` (${url})`;
  }
  return lines.map((line) => line.text).join("\n");
}
