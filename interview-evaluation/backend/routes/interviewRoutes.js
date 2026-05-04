/**
 * Express routes: interview start, schedule, submit, results, list, certification validation.
 * Mirrors: Backend/routes/interviewRoutes.js
 */
import express from 'express';
import {
  startInterview,
  submitAnswers,
  getInterviewResults,
  scheduleInterview,
  getInterviews,
  postValidateCertifications,
} from '../controllers/interviewController.js';

const router = express.Router();

router.post('/start', startInterview);
router.post('/schedule', scheduleInterview);
router.post('/certifications/validate', postValidateCertifications);
router.get('/all', getInterviews);
router.post('/:interviewId/submit', submitAnswers);
router.get('/:interviewId/results', getInterviewResults);

export default router;
