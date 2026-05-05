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
import multer from 'multer';
import { parseResumeFile, saveParsedDataToDB } from '../services/resumeParserService.js';

const router = express.Router();
const upload = multer();

router.post('/apply', authMiddleware, roleMiddleware(['candidate']), applyForJob);
router.get('/all', authMiddleware, roleMiddleware(['recruiter', 'admin']), getApplications);
router.get('/job/:jobId/ranked', authMiddleware, roleMiddleware(['recruiter', 'admin']), getRankedApplications);
router.get('/candidate/all', authMiddleware, roleMiddleware(['candidate']), getApplicationsByCandidate);
router.put('/:id/status', authMiddleware, roleMiddleware(['recruiter', 'admin']), updateApplicationStatus);
router.put('/:id/reject', authMiddleware, roleMiddleware(['recruiter', 'admin']), rejectApplication);
router.post('/resume/upload', upload.single('resume'), async (req, res) => {
  try {
    const fileBuffer = req.file.buffer;
    const fileType = req.file.mimetype;

    // Parse the resume file
    const parsedData = await parseResumeFile(fileBuffer, fileType);

    // Save parsed data to the database
    const savedProfile = await saveParsedDataToDB(parsedData);

    res.status(200).json({
      message: 'Resume parsed and saved successfully.',
      data: savedProfile,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error processing resume.',
      error: error.message,
    });
  }
});

export default router;
