import { Router } from "express";
import { explain, score } from "../controllers/matchController.js";

const router = Router();
router.post("/match", score);
router.post("/explain", explain);
export default router;
