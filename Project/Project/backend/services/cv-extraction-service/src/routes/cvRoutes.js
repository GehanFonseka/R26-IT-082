import { Router } from "express";
import multer from "multer";
import { env } from "../config/env.js";
import { extract } from "../controllers/cvController.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxFileSize },
  fileFilter: (_req, file, callback) => {
    const extension = file.originalname.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx", "txt"].includes(extension)) {
      return callback(Object.assign(new Error("Supported CV formats are PDF, DOCX and TXT"), { statusCode: 415 }));
    }
    return callback(null, true);
  },
});
const router = Router();
router.post("/extract", upload.single("file"), extract);
export default router;
