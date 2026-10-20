import { createHash } from "node:crypto";

export const cvRevision = (cv) => cv ? createHash("sha256").update(JSON.stringify([
  cv.fileName || "", cv.rawText || "", cv.candidate?.name || "",
  cv.candidate?.certifications || [], cv.candidate?.certificateDetails || [],
])).digest("hex") : "";

export const cvCertificateLinks = (cv) => [...new Set((cv?.candidate?.certificateDetails || [])
  .flatMap((entry) => [entry.url, ...(entry.urls || [])]).filter(Boolean))];
