import { Router } from "express";
import { getOwnProfile, getProfileAsAdmin, getProfilePhotosAsAdmin, saveOwnProfile } from "../controllers/profileController.js";
import { listOwnCertificateChecks, verifyOwnCertificate } from "../controllers/certificateCheckController.js";
import { getApplicantCertificates, recheckApplicantCertificate } from "../controllers/adminCertificateController.js";

const router = Router();
router.get("/profiles/me", getOwnProfile);
router.put("/profiles/me", saveOwnProfile);
router.get("/profiles/me/certificates", listOwnCertificateChecks);
router.post("/profiles/me/certificates/verify", verifyOwnCertificate);
router.post("/profiles/photos", getProfilePhotosAsAdmin);
router.get("/profiles/:userId/certificates", getApplicantCertificates);
router.post("/profiles/:userId/certificates/verify", recheckApplicantCertificate);
router.get("/profiles/:userId", getProfileAsAdmin);
export default router;
