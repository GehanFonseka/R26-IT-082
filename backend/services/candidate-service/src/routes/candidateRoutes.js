import { Router } from "express";
import { getOwnProfile, getProfileAsAdmin, getProfilePhotosAsAdmin, saveOwnProfile } from "../controllers/profileController.js";

const router = Router();
router.get("/profiles/me", getOwnProfile);
router.put("/profiles/me", saveOwnProfile);
router.post("/profiles/photos", getProfilePhotosAsAdmin);
router.get("/profiles/:userId", getProfileAsAdmin);
export default router;
