import { extractCv } from "../services/cvExtractionService.js";

export const extract = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: "A PDF, DOCX, or TXT CV file is required", requestId: req.requestId });
  const result = await extractCv(req.file);
  return res.json({ success: true, ...result, requestId: req.requestId });
};
