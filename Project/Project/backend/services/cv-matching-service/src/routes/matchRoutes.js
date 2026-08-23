import { Router } from "express";
import { score } from "../controllers/matchController.js";

const router = Router();
router.post("/match", score);
export default router;
