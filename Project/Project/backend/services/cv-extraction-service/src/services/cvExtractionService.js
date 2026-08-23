import { createRequire } from "node:module";
import * as mammoth from "mammoth";
import { extractCandidateFields } from "../utils/candidateParser.js";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse/lib/pdf-parse.js");

const extensionOf = (name) => name.split(".").pop()?.toLowerCase();

export async function extractRawText(file) {
  const extension = extensionOf(file.originalname);
  if (extension === "txt") return file.buffer.toString("utf8");
  if (extension === "pdf") {
    try { return (await pdfParse(file.buffer)).text; }
    catch (error) {
      throw Object.assign(new Error("Could not read this PDF. Please upload a valid text-based PDF, DOCX, or TXT file."), { statusCode: 422, technicalError: error.message });
    }
  }
  if (extension === "docx") {
    try { return (await mammoth.extractRawText({ buffer: file.buffer })).value; }
    catch (error) {
      throw Object.assign(new Error("Could not read this DOCX file. Please upload a valid DOCX, PDF, or TXT file."), { statusCode: 422, technicalError: error.message });
    }
  }
  throw Object.assign(new Error("Supported CV formats are PDF, DOCX and TXT"), { statusCode: 415 });
}

export async function extractCv(file) {
  const rawText = (await extractRawText(file)).replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  if (!rawText) throw Object.assign(new Error("No selectable text found. This may be a scanned PDF."), { statusCode: 422 });
  return { candidate: extractCandidateFields(rawText), rawText };
}
