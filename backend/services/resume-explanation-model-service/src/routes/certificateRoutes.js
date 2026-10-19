import { Router } from "express";
import { readCertificate } from "../services/certificateReader.js";

const router = Router();
router.post("/read-certificate", async (req, res, next) => {
  try {
    const { data, mimeType, rawText, images } = req.body || {};
    const textInput = typeof rawText === "string" && rawText.trim() && rawText.length <= 30000;
    const fileInput = typeof data === "string" && data.length <= 16777216 && /^[A-Za-z0-9+/]+={0,2}$/.test(data)
      && ["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(mimeType);
    const imageInput = Array.isArray(images) && images.length > 0 && images.length <= 12
      && images.every((image) => image && typeof image.data === "string" && image.data.length > 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(image.data)
        && ["image/jpeg", "image/png", "image/webp"].includes(image.mimeType))
      && images.reduce((total, image) => total + image.data.length, 0) <= 16777216;
    if (!textInput && !fileInput && !imageInput) return res.status(400).json({ success: false, message: "A supported certificate document is required.", requestId: req.requestId });
    const document = imageInput ? { images } : fileInput ? { data, mimeType } : {};
    if (textInput) document.rawText = rawText;
    const result = await readCertificate(document);
    return res.json({ success: true, data: result, requestId: req.requestId });
  } catch (error) { return next(error); }
});
export default router;
