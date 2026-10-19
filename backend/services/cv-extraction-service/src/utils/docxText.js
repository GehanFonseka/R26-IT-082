import * as mammoth from "mammoth";

const documentText = (node) => {
  if (node.type === "text") return node.value;
  if (node.type === "tab") return " ";
  if (node.type === "break") return "\n";
  const children = (node.children || []).map(documentText).join("");
  if (node.type === "hyperlink" && /^https?:\/\//i.test(node.href || "") && !children.includes(node.href)) {
    return `${children} (${node.href})`;
  }
  return `${children}${node.type === "paragraph" ? "\n\n" : ""}`;
};

export async function extractDocxText(buffer) {
  let text = "";
  await mammoth.convertToHtml({ buffer }, {
    transformDocument: (document) => {
      text = documentText(document);
      return document;
    },
  });
  return text;
}
