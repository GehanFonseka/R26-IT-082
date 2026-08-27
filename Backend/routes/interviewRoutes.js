import express from 'express';
import {
  startInterview,
  submitAnswers,
  getInterviewResults,
  scheduleInterview,
  getInterviews,
} from '../controllers/interviewController.js';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.js';

const router = express.Router();

router.post('/start', authMiddleware, roleMiddleware(['candidate']), startInterview);
router.post('/schedule', authMiddleware, roleMiddleware(['recruiter', 'admin']), scheduleInterview);
router.post('/:interviewId/submit', authMiddleware, roleMiddleware(['candidate']), submitAnswers);
router.get('/:interviewId/results', authMiddleware, getInterviewResults);
router.get('/all', authMiddleware, getInterviews);

export default router;
