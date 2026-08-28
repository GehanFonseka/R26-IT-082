import CandidateProfile from '../models/CandidateProfile.js';
import { parseResume } from '../services/resumeParserService.js';

export const createOrUpdateProfile = async (req, res) => {
  try {
    const { skills, education, experience, location, bio, phone, github, portfolio } = req.body;

    let profile = await CandidateProfile.findOne({ userId: req.userId });

    if (!profile) {
      profile = new CandidateProfile({ userId: req.userId });
    }

    // Update fields
    if (skills) profile.skills = Array.isArray(skills) ? skills : [skills];
    if (education) profile.education = education;
    if (experience) profile.experience = experience;
    if (location) profile.location = location;
    if (bio) profile.bio = bio;
    if (phone) profile.phone = phone;
    if (github) profile.github = github;
    if (portfolio) profile.portfolio = portfolio;

    // Handle file upload
    if (req.file) {
      profile.resumeFileName = req.file.filename;
      profile.resumeUrl = `/uploads/${req.file.filename}`;

      // Parse resume
      try {
        const parsedData = await parseResume(req.file.path);
        profile.parsedResume = parsedData;
        
        // Auto-extract skills if not provided
        if (parsedData.extractedSkills && parsedData.extractedSkills.length > 0 && !skills) {
          profile.skills = [...new Set([...profile.skills, ...parsedData.extractedSkills])];
        }
      } catch (parseError) {
        console.error('Resume parsing error:', parseError);
        // Continue without parsed data
      }
    }

    await profile.save();
    res.status(200).json({ message: 'Profile updated', profile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const profile = await CandidateProfile.findOne({ userId: req.userId });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.status(200).json({ profile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProfileById = async (req, res) => {
  try {
    const profile = await CandidateProfile.findOne({ userId: req.params.userId });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.status(200).json({ profile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    let profile = await CandidateProfile.findOne({ userId: req.userId });
    if (!profile) {
      profile = new CandidateProfile({ userId: req.userId });
    }

    profile.resumeFileName = req.file.filename;
    profile.resumeUrl = `/uploads/${req.file.filename}`;

    // Parse resume
    const parsedData = await parseResume(req.file.path);
    profile.parsedResume = parsedData;

    await profile.save();
    res.status(200).json({ message: 'Resume uploaded and parsed', profile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
