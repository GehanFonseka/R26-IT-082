import express from 'express';
import {
  applyForJob,
  getApplications,
  updateApplicationStatus,
  getApplicationsByCandidate,
  rejectApplication,
  getRankedApplications,
} from '../controllers/applicationController.js';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.js';

const router = express.Router();

router.post('/apply', authMiddleware, roleMiddleware(['candidate']), applyForJob);
router.get('/all', authMiddleware, roleMiddleware(['recruiter', 'admin']), getApplications);
router.get('/job/:jobId/ranked', authMiddleware, roleMiddleware(['recruiter', 'admin']), getRankedApplications);
router.get('/candidate/all', authMiddleware, roleMiddleware(['candidate']), getApplicationsByCandidate);
router.put('/:id/status', authMiddleware, roleMiddleware(['recruiter', 'admin']), updateApplicationStatus);
router.put('/:id/reject', authMiddleware, roleMiddleware(['recruiter', 'admin']), rejectApplication);

export default router;
