import express from 'express';
import {
  createOrUpdateProfile,
  getProfile,
  getProfileById,
  uploadResume,
  getSkills,
} from '../controllers/candidateController.js';
import { authMiddleware } from '../middlewares/auth.js';
import { upload } from '../middlewares/upload.js';

const router = express.Router();

router.post('/profile', authMiddleware, createOrUpdateProfile);
router.get('/profile', authMiddleware, getProfile);
router.get('/profile/:userId', getProfileById);
router.get('/:userId/skills', getSkills);
router.post('/resume/upload', authMiddleware, upload.single('resume'), uploadResume);
router.put('/profile/update', authMiddleware, createOrUpdateProfile);

export default router;
