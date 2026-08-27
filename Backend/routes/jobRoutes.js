import express from 'express';
import {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
} from '../controllers/jobController.js';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.js';

const router = express.Router();

router.post('/create', authMiddleware, roleMiddleware(['recruiter', 'admin']), createJob);
router.get('/all', getAllJobs);
router.get('/:id', getJobById);
router.put('/:id', authMiddleware, roleMiddleware(['recruiter', 'admin']), updateJob);
router.delete('/:id', authMiddleware, roleMiddleware(['recruiter', 'admin']), deleteJob);

export default router;
