import express from 'express';
import {
  getRecruiterDashboard,
  getAdminDashboard,
  getCandidateDashboard,
} from '../controllers/dashboardController.js';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.js';

const router = express.Router();

router.get('/recruiter', authMiddleware, roleMiddleware(['recruiter']), getRecruiterDashboard);
router.get('/admin', authMiddleware, roleMiddleware(['admin']), getAdminDashboard);
router.get('/candidate', authMiddleware, roleMiddleware(['candidate']), getCandidateDashboard);

export default router;
