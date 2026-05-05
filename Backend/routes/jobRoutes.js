import express from 'express';
import {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
} from '../controllers/jobController.js';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.js';
import { calculateMatchScore } from '../services/matchingService.js';

const router = express.Router();

router.post('/create', authMiddleware, roleMiddleware(['recruiter', 'admin']), createJob);
router.get('/all', getAllJobs);
router.get('/:id', getJobById);
router.put('/:id', authMiddleware, roleMiddleware(['recruiter', 'admin']), updateJob);
router.delete('/:id', authMiddleware, roleMiddleware(['recruiter', 'admin']), deleteJob);

/**
 * Calculate match score between candidate and job
 */
router.post('/matching/calculate', authMiddleware, async (req, res) => {
  try {
    const { candidateId, jobId } = req.body;

    if (!candidateId || !jobId) {
      return res.status(400).json({
        message: 'candidateId and jobId are required',
      });
    }

    const matchScore = await calculateMatchScore(candidateId, jobId);

    // Generate explanation for the match score
    const explanation = {
      matchedSkills: [],
      missingSkills: [],
      experienceMismatch: false,
      overallFit: matchScore >= 70 ? 'Good' : matchScore >= 50 ? 'Moderate' : 'Poor',
    };

    res.status(200).json({
      message: 'Match score calculated successfully.',
      data: {
        matchScore,
        explanation,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error calculating match score.',
      error: error.message,
    });
  }
});

export default router;
