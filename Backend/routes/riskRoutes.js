import express from 'express';
import {
  predictCandidateRisk,
  getRiskPrediction,
  getRiskPredictions,
} from '../controllers/riskController.js';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.js';

const router = express.Router();

router.post('/predict', authMiddleware, roleMiddleware(['recruiter', 'admin']), predictCandidateRisk);
router.get('/:id', authMiddleware, getRiskPrediction);
router.get('/all', authMiddleware, roleMiddleware(['recruiter', 'admin']), getRiskPredictions);

export default router;
