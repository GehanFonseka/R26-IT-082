/**
 * Interview evaluation schema (MongoDB / Mongoose).
 * Mirrors: Backend/models/Interview.js
 */
import mongoose from 'mongoose';

const interviewSchema = new mongoose.Schema(
  {
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vacancy', required: true },
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
    interviewerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    status: {
      type: String,
      enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    scheduledAt: { type: Date, required: true },
    completedAt: { type: Date, default: null },
    questions: [
      { id: String, text: String, type: String, options: [String] },
    ],
    answers: [
      { questionId: String, answer: String, confidence: Number },
    ],
    scores: {
      technical: { type: Number, min: 0, max: 100, default: 0 },
      communication: { type: Number, min: 0, max: 100, default: 0 },
      confidence: { type: Number, min: 0, max: 100, default: 0 },
      overall: { type: Number, min: 0, max: 100, default: 0 },
    },
    feedback: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('Interview', interviewSchema);
