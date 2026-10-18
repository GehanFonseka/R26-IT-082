import { parseCertificateWebpage } from "../utils/certificateWebpage.js";
import { hasCertificateNameEvidence } from "../utils/certificateNames.js";
import { distinctCertificateRecipients } from "../utils/certificateRecipients.js";
import { isNonCertificateRecipient } from "../utils/certificateRecipientRoles.js";
import { renderCertificatePage } from "./certificateBrowser.js";
import { readCertificateWithModel } from "./certificateOcrClient.js";
import { downloadCertificate } from "./certificateDownload.js";
import { extractRawText } from "./cvExtractionService.js";

export async function readCertificatePage(file, requestId, options = {}) {
  const rendered = await (options.renderPage || renderCertificatePage)(file, options);
  const page = parseCertificateWebpage(rendered.html, rendered.sourceUrl);
  const original = parseCertificateWebpage(file.buffer.toString("utf8"), file.sourceUrl);
  const input = { images: rendered.images, ...(rendered.rawText ? { rawText: rendered.rawText } : {}) };
  const embedded = rendered.documents?.[0];
  if (embedded) {
    input.data = embedded.buffer.toString("base64");
    input.mimeType = "application/pdf";
    try {
      const text = await extractRawText({ originalname: "certificate.pdf", buffer: embedded.buffer });
      input.rawText = `${(input.rawText || "").slice(0, 20000)}\nEMBEDDED CERTIFICATE PDF:\n${text.slice(0, 9000)}`;
    } catch { /* The model still inspects the rasterized PDF when selectable text is unavailable. */ }
  }
  if (page.recipientName && hasCertificateNameEvidence(rendered.rawText, page.recipientName)) {
    input.rawText += `\nRecipient name: ${page.recipientName}`;
  }
  if (options.modelPurpose) input.purpose = options.modelPurpose;
  const visual = await (options.modelReader || readCertificateWithModel)(input, requestId);
  const evidence = String(visual.documentText || "");
  const pageName = typeof rendered.rawText !== "string" || hasCertificateNameEvidence(`${rendered.rawText}\n${evidence}`, page.recipientName)
    ? page.recipientName : "";
  const names = [visual.recipientName, ...(visual.recipientNames || [])].filter((name) => typeof name === "string" && name.trim()
    && hasCertificateNameEvidence(evidence, name) && !isNonCertificateRecipient(name, rendered.rawText)).map((name) => name.trim().slice(0, 180));
  if (pageName) names.push(pageName);
  let confidence = names.length === 1 && pageName === names[0] ? 1 : Math.min(1, Math.max(0, Number(visual.confidence) || 0));
  let documentText = evidence;
  let source = visual.source || "image_ocr";
  let visionUsed = visual.visionUsed === true;
  const warnings = [visual.warning].filter(Boolean);
  let linkedComplete = true;
  if (options.readLinked) {
    const files = (rendered.documents || []).filter((document) => document !== embedded);
    const urls = [...new Set([...page.documentUrls, ...original.documentUrls])]
      .filter((url) => !(rendered.documents || []).some((document) => document.sourceUrl === url))
      .filter((url) => !names.length || /\.(?:pdf|docx)(?:[?#]|$)/i.test(url)).slice(0, 6);
    for (const linked of [...files, ...urls]) {
      try {
        const document = await options.readLinked(typeof linked === "string" ? await (options.download || downloadCertificate)(linked) : linked);
        if (document.recipientName) {
          names.push(document.recipientName, ...(document.recipientNames || []));
          confidence = names.length === 1 ? document.confidence : Math.min(confidence || document.confidence, document.confidence);
          documentText += `\n${document.documentText || document.recipientName}`;
        }
        if (document.visionUsed) { visionUsed = true; source = "local_vision"; }
        else if (!visionUsed && document.recipientName) source = document.source || "document_text";
        linkedComplete = linkedComplete && document.scanComplete !== false;
        if (document.warning) warnings.push(document.warning);
      } catch { linkedComplete = false; }
    }
  }
  const recipientNames = distinctCertificateRecipients(names);
  if (recipientNames.length === 1 && pageName === recipientNames[0] && !visionUsed) source = "html_text";
  return { recipientName: recipientNames[0] || "", recipientNames, method: "browser",
    confidence, scanComplete: rendered.complete && linkedComplete && visual.inspectionComplete !== false,
    documentText, source, visionUsed, warning: [...new Set(warnings)].join(" "), blocks: visual.blocks || [] };
}
