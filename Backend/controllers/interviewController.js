import Interview from '../models/Interview.js';
import Application from '../models/Application.js';
import { evaluateAnswers } from '../services/interviewService.js';
import { evaluateInterviewResponse } from '../ai-modules/interviewEvaluationAI.js';

export const startInterview = async (req, res) => {
  try {
    const { applicationId, jobId, questions } = req.body;

    if (!applicationId || !jobId) {
      return res.status(400).json({ message: 'Application ID and Job ID are required' });
    }

    const interview = new Interview({
      candidateId: req.userId,
      jobId,
      applicationId,
      questions: questions || [],
      scheduledAt: new Date(),
      status: 'in-progress',
    });

    await interview.save();
    res.status(201).json({ message: 'Interview started', interview });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const submitAnswers = async (req, res) => {
  try {
    const { answers } = req.body;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: 'Answers array is required' });
    }

    const interview = await Interview.findById(req.params.interviewId);
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    interview.answers = answers;
    interview.completedAt = new Date();
    interview.status = 'completed';

    // Evaluate each answer using AI Module 3 (Interview Evaluation)
    const evaluations = await Promise.all(
      answers.map(async (answer, index) => {
        const interviewData = {
          type: answer.type || 'text', // 'text', 'mcq', 'video'
          question: interview.questions[index]?.question || '',
          response: answer.response || '',
          selectedAnswer: answer.selectedAnswer,
          correctAnswer: answer.correctAnswer,
          videoMetadata: answer.videoMetadata,
        };
        const evaluation = await evaluateInterviewResponse(interviewData);
        return {
          questionIndex: index,
          ...evaluation,
        };
      })
    );

    // Calculate overall interview score
    const overallScore = Math.round(
      evaluations.reduce((sum, evaluation) => sum + evaluation.overall_score, 0) / evaluations.length
    );

    interview.evaluations = evaluations;
    interview.overallScore = overallScore;
    interview.result = overallScore >= 60 ? 'pass' : 'fail';
    interview.scores = {
      overall: overallScore,
      communication: Math.round(evaluations.reduce((sum, evaluation) => sum + evaluation.communication_score, 0) / evaluations.length),
      confidence: Math.round(evaluations.reduce((sum, evaluation) => sum + evaluation.confidence_score, 0) / evaluations.length),
      clarity: Math.round(evaluations.reduce((sum, evaluation) => sum + evaluation.clarity_score, 0) / evaluations.length),
    };

    // Update related application status
    if (interview.applicationId) {
      await Application.findByIdAndUpdate(
        interview.applicationId,
        { 
          interviewScore: overallScore,
          interviewResult: interview.result,
          status: interview.result === 'pass' ? 'interview-passed' : 'interview-failed',
        }
      );
    }

    await interview.save();
    res.status(200).json({ 
      message: 'Answers submitted and evaluated', 
      interview,
      overallScore,
      result: interview.result,
      evaluations,
    });
  } catch (error) {
    console.error('Submit answers error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getInterviewResults = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.interviewId)
      .populate('candidateId', 'name email')
      .populate('jobId', 'title');

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    res.status(200).json({ interview });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const scheduleInterview = async (req, res) => {
  try {
    const { candidateId, jobId, applicationId, scheduledAt, interviewerIds } = req.body;

    if (!candidateId || !jobId || !scheduledAt) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const interview = new Interview({
      candidateId,
      jobId,
      applicationId,
      scheduledAt: new Date(scheduledAt),
      interviewerIds: interviewerIds || [],
      status: 'scheduled',
    });

    await interview.save();
    res.status(201).json({ message: 'Interview scheduled', interview });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getInterviews = async (req, res) => {
  try {
    const { candidateId, jobId, status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (candidateId) filter.candidateId = candidateId;
    if (jobId) filter.jobId = jobId;
    if (status) filter.status = status;

    const interviews = await Interview.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('candidateId', 'name email')
      .populate('jobId', 'title')
      .sort({ scheduledAt: -1 });

    const total = await Interview.countDocuments(filter);

    res.status(200).json({
      interviews,
      pagination: { total, page: parseInt(page), limit: parseInt(limit) },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
