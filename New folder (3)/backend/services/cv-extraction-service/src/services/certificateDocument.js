import { extractRawText } from "./cvExtractionService.js";
import { readCertificateWithModel } from "./certificateOcrClient.js";
import { certificateRecipient, hasCertificateNameEvidence } from "../utils/certificateNames.js";
import { parseCertificateWebpage } from "../utils/certificateWebpage.js";
import { downloadCertificate } from "./certificateDownload.js";
import { readCertificatePage } from "./certificatePageReader.js";

export function certificateFormat({ buffer, mimeType }) {
  if (buffer.subarray(0, 5).toString() === "%PDF-") return { extension: "pdf", mimeType: "application/pdf" };
  if (buffer.subarray(0, 2).toString() === "PK") return { extension: "docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" };
  if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return { extension: "image", mimeType: "image/png" };
  if (buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255) return { extension: "image", mimeType: "image/jpeg" };
  if (buffer.subarray(0, 4).toString() === "RIFF" && buffer.subarray(8, 12).toString() === "WEBP") return { extension: "image", mimeType: "image/webp" };
  if (mimeType === "text/plain") return { extension: "txt", mimeType };
  if (["text/html", "application/xhtml+xml"].includes(mimeType) || /^\s*(?:<!doctype\s+html|<html)\b/i.test(buffer.subarray(0, 500).toString())) return { extension: "html", mimeType: "text/html" };
  return null;
}

export async function readCertificateDocument(file, requestId, options = {}) {
  const format = certificateFormat(file);
  if (!format) throw new Error("This link does not expose a readable certificate document or verification page. Check its sharing permissions or use a direct certificate link.");
  if (format.extension === "html") {
    if (file.sourceUrl && !options.webDepth && options.renderPage !== false) return readCertificatePage(file, requestId, {
      ...options, readLinked: (linked) => readCertificateDocument(linked, requestId, { ...options, webDepth: 1 }),
    });
    const page = parseCertificateWebpage(file.buffer.toString("utf8"), file.sourceUrl);
    if (page.recipientName) return { recipientName: page.recipientName, method: "web", confidence: 1 };
    if (!options.webDepth) {
      for (const url of page.documentUrls) {
        try {
          const linked = await (options.download || downloadCertificate)(url);
          const result = await readCertificateDocument(linked, requestId, { ...options, webDepth: 1 });
          if (result.recipientName) return result;
        } catch { /* A blocked or unreadable asset cannot be used as name evidence. */ }
      }
    }
    throw new Error("The verification page did not expose a readable public certificate. Check its sharing permissions or use its certificate image or PDF link.");
  }
  let rawText = "";
  if (format.extension !== "image") {
    try { rawText = (await extractRawText({ originalname: `certificate.${format.extension}`, buffer: file.buffer })).slice(0, 30000); }
    catch (error) { if (format.extension !== "pdf") throw error; }
    const recipientName = certificateRecipient(rawText);
    if (recipientName && (format.extension !== "pdf" || !options.includeEvidence)) return { recipientName, method: "text", confidence: 1,
      ...(options.includeEvidence ? { documentText: rawText, source: "document_text", scanComplete: true } : {}) };
  }
  const document = format.extension === "pdf" || format.extension === "image"
    ? { data: file.buffer.toString("base64"), mimeType: format.mimeType, ...(rawText.trim() ? { rawText } : {}) }
    : { rawText };
  if (options.modelPurpose) document.purpose = options.modelPurpose;
  const result = await (options.modelReader || readCertificateWithModel)(document, requestId);
  const recipientName = typeof result.recipientName === "string" ? result.recipientName.trim().slice(0, 180) : "";
  const evidence = typeof result.documentText === "string" ? result.documentText : "";
  return {
    recipientName: hasCertificateNameEvidence(evidence, recipientName) ? recipientName : "",
    method: "ocr", confidence: Math.min(1, Math.max(0, Number(result.confidence) || 0)),
    recipientNames: (Array.isArray(result.recipientNames) ? result.recipientNames : []).filter((name) => typeof name === "string"
      && hasCertificateNameEvidence(evidence, name)).map((name) => name.trim().slice(0, 180)),
    documentText: evidence, source: result.source || "image_ocr", visionUsed: result.visionUsed === true,
    scanComplete: result.inspectionComplete !== false, warning: result.warning || "", blocks: result.blocks || [],
  };
}
