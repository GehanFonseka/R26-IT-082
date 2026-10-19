import { Router } from "express";
import { verifyCertificate } from "../services/certificateVerification.js";
import { verifyWebsiteContent } from "../services/websiteVerification.js";

const router = Router();
router.post("/certificates/verify", async (req, res, next) => {
  try {
    const { url, rawText } = req.body || {};
    if (typeof url !== "string" || url.length > 2048 || typeof rawText !== "string" || !rawText.trim() || rawText.length > 50000) {
      return res.status(400).json({ success: false, message: "A certificate link and the original CV text are required.", requestId: req.requestId });
    }
    const data = await verifyCertificate({ url, rawText, requestId: req.requestId });
    return res.json({ success: true, data, requestId: req.requestId });
  } catch (error) { return next(error); }
});
router.post("/certificates/content/verify", async (req, res, next) => {
  try {
    const { url, targetText, expectedFields = {} } = req.body || {};
    const allowed = new Set(["certificateId", "recipientName", "issuer", "courseTitle"]);
    if (typeof url !== "string" || url.length > 2048 || typeof targetText !== "string" || !targetText.trim() || targetText.length > 500
      || !expectedFields || typeof expectedFields !== "object" || Array.isArray(expectedFields)
      || Object.entries(expectedFields).some(([key, value]) => !allowed.has(key) || typeof value !== "string" || !value.trim() || value.length > 500)) {
      return res.status(400).json({ success: false, message: "A website URL and search text are required.", requestId: req.requestId });
    }
    const data = await verifyWebsiteContent({ url, targetText: targetText.trim(), expectedFields, requestId: req.requestId });
    return res.json({ success: true, data, requestId: req.requestId });
  } catch (error) { return next(error); }
});
export default router;
