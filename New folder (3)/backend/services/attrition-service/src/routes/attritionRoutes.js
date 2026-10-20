import { Router } from "express";
import { predict } from "../controllers/attritionController.js";
const router = Router();
router.post("/predict", predict);
router.post("/assess", predict);
export default router;
