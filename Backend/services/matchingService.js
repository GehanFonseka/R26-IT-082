import CandidateProfile from '../models/CandidateProfile.js';
import Vacancy from '../models/Vacancy.js';

export const calculateMatchScore = async (candidateId, jobId) => {
  try {
    const candidate = await CandidateProfile.findOne({ userId: candidateId });
    const job = await Vacancy.findById(jobId);

    if (!candidate || !job) {
      return 0;
    }

    let score = 0;
    let weights = {
      skills: 0.4,
      experience: 0.3,
      education: 0.2,
      location: 0.1,
    };

    // Skills matching (40%)
    const candidateSkills = candidate.skills.map(s => s.toLowerCase());
    const requiredSkills = job.requiredSkills.map(s => s.toLowerCase());
    const matchedSkills = requiredSkills.filter(skill => candidateSkills.includes(skill));
    const skillsScore = (matchedSkills.length / (requiredSkills.length || 1)) * 100;
    score += skillsScore * weights.skills;

    // Experience matching (30%)
    const experienceScore = Math.min((candidate.experience / job.experienceRequired * 100) || 0, 100);
    score += experienceScore * weights.experience;

    // Education matching (20%)
    const educationScore = candidate.education ? 60 : 20;
    score += educationScore * weights.education;

    // Location matching (10%)
    const locationScore = candidate.location && candidate.location.toLowerCase() === job.location.toLowerCase() ? 100 : 50;
    score += locationScore * weights.location;

    return Math.min(Math.round(score), 100);
  } catch (error) {
    console.error('Match score calculation error:', error);
    return 0;
  }
};

export const getTopCandidates = async (jobId, limit = 10) => {
  try {
    const job = await Vacancy.findById(jobId);
    if (!job) return [];

    // This is a simplified version - in production, you'd fetch all applications and score them
    return [];
  } catch (error) {
    console.error('Get top candidates error:', error);
    return [];
  }
};
