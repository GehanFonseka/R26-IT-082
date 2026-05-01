import mongoose from 'mongoose';

const candidateProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    education: {
      type: String,
      default: '',
    },
    experience: {
      type: Number,
      default: 0,
      min: 0,
    },
    resumeUrl: {
      type: String,
      default: null,
    },
    resumeFileName: {
      type: String,
      default: null,
    },
    parsedResume: {
      text: String,
      extractedSkills: [String],
      extractedExperience: String,
      extractedEducation: String,
    },
    location: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
      maxlength: 500,
    },
    phone: {
      type: String,
      default: '',
    },
    github: {
      type: String,
      default: '',
    },
    portfolio: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

export default mongoose.model('CandidateProfile', candidateProfileSchema);
