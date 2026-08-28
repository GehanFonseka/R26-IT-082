import mongoose from 'mongoose';

const riskPredictionSchema = new mongoose.Schema(
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
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low',
    },
    probability: {
      type: Number,
      min: 0,
      max: 1,
      default: 0,
    },
    factors: [
      {
        factor: String,
        weight: Number,
        description: String,
      },
    ],
    prediction: {
      jobHopping: Number,
      skillMismatch: Number,
      cultural_fit: Number,
      overqualified: Number,
      underqualified: Number,
    },
    explanation: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

export default mongoose.model('RiskPrediction', riskPredictionSchema);
