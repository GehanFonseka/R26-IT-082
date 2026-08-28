import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vacancy',
      required: true,
    },
    status: {
      type: String,
      enum: ['applied', 'shortlisted', 'interview', 'rejected', 'offered', 'hired'],
      default: 'applied',
    },
    matchScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    interviewScore: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },
    riskScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low',
    },
    notes: {
      type: String,
      default: '',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Ensure unique application per candidate-job pair
applicationSchema.index({ candidateId: 1, jobId: 1 }, { unique: true });

export default mongoose.model('Application', applicationSchema);
