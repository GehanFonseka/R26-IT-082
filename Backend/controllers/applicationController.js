import Application from '../models/Application.js';
import Vacancy from '../models/Vacancy.js';
import { calculateMatchScore } from '../services/matchingService.js';

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

    // Calculate match score
    const matchScore = await calculateMatchScore(req.userId, jobId);

    const application = new Application({
      candidateId: req.userId,
      jobId,
      matchScore,
    });

    await application.save();

    // Increment applicant count
    job.applicantCount += 1;
    await job.save();

    res.status(201).json({ message: 'Application submitted', application });
  } catch (error) {
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
