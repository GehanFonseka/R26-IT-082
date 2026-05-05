import Application from '../models/Application.js';
import Vacancy from '../models/Vacancy.js';
import CandidateProfile from '../models/CandidateProfile.js';
import { calculateMatchScore } from '../services/matchingService.js';
import { calculateMatchScoreWithExplanation, rankCandidatesForJob } from '../ai-modules/matchingAI.js';
import { parseResumeFile, calculateSkillScore } from '../ai-modules/resumeParsingAI.js';
import { predictHiringRisk } from '../ai-modules/riskPredictionAI.js';

export const applyForJob = async (req, res) => {
  try {
    const { jobId } = req.body;

    if (!jobId) {
      return res.status(400).json({ message: 'Job ID is required' });
    }

    // Check if job exists
    const job = await Vacancy.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if already applied
    const existingApplication = await Application.findOne({ candidateId: req.userId, jobId });
    if (existingApplication) {
      return res.status(400).json({ message: 'Already applied for this job' });
    }

    // Get candidate profile
    const candidate = await CandidateProfile.findOne({ userId: req.userId });
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate profile not found' });
    }

    // Calculate match score using AI Module 2 (with explanation)
    const matchScoreData = await calculateMatchScoreWithExplanation(candidate, job);
    
    // Predict hiring risk using AI Module 4
    const riskPrediction = await predictHiringRisk(candidate, job, {});

    const application = new Application({
      candidateId: req.userId,
      jobId,
      matchScore: matchScoreData.overall_score,
      matchScoreDetails: matchScoreData,
      riskPrediction: {
        riskLevel: riskPrediction.risk_level,
        riskScore: riskPrediction.overall_risk_score,
        attritionProbability: riskPrediction.attrition_probability,
      },
      status: 'applied',
      appliedAt: new Date(),
    });

    await application.save();

    // Increment applicant count
    job.applicantCount += 1;
    await job.save();

    res.status(201).json({ 
      message: 'Application submitted', 
      application,
      matchScore: matchScoreData.overall_score,
      matchLevel: matchScoreData.match_level,
      riskLevel: riskPrediction.risk_level,
    });
  } catch (error) {
    console.error('Apply for job error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getRankedApplications = async (req, res) => {
  try {
    const { jobId, limit = 10 } = req.query;

    if (!jobId) {
      return res.status(400).json({ message: 'Job ID is required' });
    }

    // Get all applications for the job
    const applications = await Application.find({ jobId })
      .populate('candidateId', 'name email')
      .lean();

    if (applications.length === 0) {
      return res.status(200).json({ applications: [], message: 'No applications found' });
    }

    // Get job details
    const job = await Vacancy.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Get candidate profiles and rank using AI Module 2
    const candidates = await Promise.all(
      applications.map(async (app) => {
        const candidate = await CandidateProfile.findOne({ userId: app.candidateId._id });
        const matchScore = await calculateMatchScoreWithExplanation(candidate, job);
        const riskPrediction = await predictHiringRisk(candidate, job, {});
        
        return {
          ...app,
          matchScore: matchScore.overall_score,
          matchLevel: matchScore.match_level,
          matchDetails: matchScore,
          riskScore: riskPrediction.overall_risk_score,
          riskLevel: riskPrediction.risk_level,
        };
      })
    );

    // Sort by match score descending
    const ranked = candidates.sort((a, b) => b.matchScore - a.matchScore).slice(0, limit);

    res.status(200).json({ 
      applications: ranked,
      total: applications.length,
      ranked_count: ranked.length,
    });
  } catch (error) {
    console.error('Get ranked applications error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getApplications = async (req, res) => {
  try {
    const { candidateId, jobId, status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (candidateId) filter.candidateId = candidateId;
    if (jobId) filter.jobId = jobId;
    if (status) filter.status = status;

    const applications = await Application.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('candidateId', 'name email')
      .populate('jobId', 'title location')
      .sort({ createdAt: -1 });

    const total = await Application.countDocuments(filter);

    res.status(200).json({
      applications,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateApplicationStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { status, notes },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    res.status(200).json({ message: 'Application updated', application });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getApplicationsByCandidate = async (req, res) => {
  try {
    const applications = await Application.find({ candidateId: req.userId })
      .populate('jobId', 'title location company')
      .sort({ createdAt: -1 });

    res.status(200).json({ applications });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const rejectApplication = async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', rejectionReason },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    res.status(200).json({ message: 'Application rejected', application });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
