import RiskPrediction from '../models/RiskPrediction.js';
import { predictRisk } from '../services/riskService.js';
import Application from '../models/Application.js';
import CandidateProfile from '../models/CandidateProfile.js';
import Vacancy from '../models/Vacancy.js';

export const predictCandidateRisk = async (req, res) => {
  try {
    const { candidateId, jobId, applicationId } = req.body;

    if (!candidateId || !jobId) {
      return res.status(400).json({ message: 'Candidate ID and Job ID are required' });
    }

    // Get candidate profile and job details
    const candidate = await CandidateProfile.findOne({ userId: candidateId });
    const job = await Vacancy.findById(jobId);

    if (!candidate || !job) {
      return res.status(404).json({ message: 'Candidate or Job not found' });
    }

    // Predict risk
    const riskPrediction = await predictRisk(candidate, job);

    const risk = new RiskPrediction({
      candidateId,
      jobId,
      applicationId: applicationId || null,
      riskLevel: riskPrediction.riskLevel,
      probability: riskPrediction.probability,
      factors: riskPrediction.factors,
      prediction: riskPrediction.prediction,
      explanation: riskPrediction.explanation,
    });

    await risk.save();

    // Update application with risk score
    if (applicationId) {
      await Application.findByIdAndUpdate(applicationId, {
        riskScore: riskPrediction.probability * 100,
        riskLevel: riskPrediction.riskLevel,
      });
    }

    res.status(201).json({ message: 'Risk prediction completed', risk });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getRiskPrediction = async (req, res) => {
  try {
    const riskPrediction = await RiskPrediction.findById(req.params.id)
      .populate('candidateId', 'name email')
      .populate('jobId', 'title');

    if (!riskPrediction) {
      return res.status(404).json({ message: 'Risk prediction not found' });
    }

    res.status(200).json({ riskPrediction });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getRiskPredictions = async (req, res) => {
  try {
    const { candidateId, jobId, riskLevel, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (candidateId) filter.candidateId = candidateId;
    if (jobId) filter.jobId = jobId;
    if (riskLevel) filter.riskLevel = riskLevel;

    const predictions = await RiskPrediction.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('candidateId', 'name email')
      .populate('jobId', 'title')
      .sort({ createdAt: -1 });

    const total = await RiskPrediction.countDocuments(filter);

    res.status(200).json({
      predictions,
      pagination: { total, page: parseInt(page), limit: parseInt(limit) },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
