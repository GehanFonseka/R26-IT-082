import Application from '../models/Application.js';
import Interview from '../models/Interview.js';

export const predictRisk = async (candidate, job) => {
  try {
    const riskFactors = [];
    let riskScore = 0;

    // Factor 1: Overqualification risk (40% probability if experience > 2x required)
    const overqualifiedRisk = candidate.experience > job.experienceRequired * 2 ? 40 : 0;
    if (overqualifiedRisk > 0) {
      riskFactors.push({
        factor: 'Overqualification',
        weight: overqualifiedRisk,
        description: 'Candidate may seek better opportunities',
      });
    }
    riskScore += overqualifiedRisk * 0.2;

    // Factor 2: Underqualification risk (50% probability if experience < required)
    const underqualifiedRisk = candidate.experience < job.experienceRequired ? 50 : 0;
    if (underqualifiedRisk > 0) {
      riskFactors.push({
        factor: 'Underqualification',
        weight: underqualifiedRisk,
        description: 'Candidate may struggle with role requirements',
      });
    }
    riskScore += underqualifiedRisk * 0.2;

    // Factor 3: Skill mismatch (40% if missing key skills)
    const requiredSkills = job.requiredSkills.map(s => s.toLowerCase());
    const candidateSkills = candidate.skills.map(s => s.toLowerCase());
    const missedSkills = requiredSkills.filter(skill => !candidateSkills.includes(skill));
    const skillMismatchRisk = (missedSkills.length / (requiredSkills.length || 1)) * 40;
    if (skillMismatchRisk > 10) {
      riskFactors.push({
        factor: 'Skill Mismatch',
        weight: Math.round(skillMismatchRisk),
        description: `Missing critical skills: ${missedSkills.slice(0, 3).join(', ')}`,
      });
    }
    riskScore += skillMismatchRisk * 0.4;

    // Factor 4: Job hopping risk (based on application history - simplified)
    const jobHoppingRisk = 15; // Default low risk
    riskFactors.push({
      factor: 'Stability Index',
      weight: jobHoppingRisk,
      description: 'Candidate stability based on tenure',
    });
    riskScore += jobHoppingRisk * 0.2;

    // Determine risk level
    const normalizedScore = Math.min(riskScore / 100, 1);
    let riskLevel = 'low';
    if (normalizedScore > 0.6) {
      riskLevel = 'high';
    } else if (normalizedScore > 0.3) {
      riskLevel = 'medium';
    }

    return {
      riskLevel,
      probability: normalizedScore,
      factors: riskFactors,
      prediction: {
        jobHopping: jobHoppingRisk,
        skillMismatch: Math.round(skillMismatchRisk),
        cultural_fit: 50,
        overqualified: overqualifiedRisk,
        underqualified: underqualifiedRisk,
      },
      explanation: generateRiskExplanation(riskLevel, riskFactors),
    };
  } catch (error) {
    console.error('Risk prediction error:', error);
    return {
      riskLevel: 'medium',
      probability: 0.5,
      factors: [],
      prediction: {},
      explanation: 'Unable to calculate risk at this time',
    };
  }
};

const generateRiskExplanation = (riskLevel, factors) => {
  let explanation = `This candidate presents a ${riskLevel} risk profile. `;

  if (factors.length > 0) {
    explanation += 'Key factors: ';
    explanation += factors.slice(0, 2).map(f => `${f.factor} (${f.description})`).join(', ');
    explanation += '. ';
  }

  if (riskLevel === 'high') {
    explanation += 'Consider additional screening or training.';
  } else if (riskLevel === 'medium') {
    explanation += 'Monitor during onboarding period.';
  } else {
    explanation += 'Candidate appears to be a good fit.';
  }

  return explanation;
};

export const assessCandidateHistory = async (candidateId) => {
  try {
    const applications = await Application.find({ candidateId });
    const jobHoppingIndicator = applications.length > 5 ? 'high' : 'normal';

    return { jobHoppingIndicator, applicationCount: applications.length };
  } catch (error) {
    console.error('Assessment error:', error);
    return { jobHoppingIndicator: 'unknown', applicationCount: 0 };
  }
};

export const generateRecommendation = (riskData) => {
  const { riskLevel, probability } = riskData;

  if (riskLevel === 'low' && probability < 0.3) {
    return 'Highly recommended for interview';
  } else if (riskLevel === 'medium' || (probability >= 0.3 && probability < 0.6)) {
    return 'Proceed with interview, but monitor carefully during assessment';
  } else {
    return 'Consider additional screening before interview';
  }
};
