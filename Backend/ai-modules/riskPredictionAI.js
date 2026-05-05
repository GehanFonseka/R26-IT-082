/**
 * AI Module 4: Hiring Risk & Attrition Prediction
 * Features:
 * - Predicts likelihood of early resignation
 * - Generates risk scores (Low / Medium / High)
 * - Helps avoid poor hiring decisions
 * - Identifies risk factors and mitigation strategies
 */

/**
 * Predict hiring risk for a candidate in a specific role
 */
export const predictHiringRisk = async (candidate, job, historicalData = {}) => {
  try {
    const riskFactors = {};
    let totalRiskScore = 0;

    // Calculate individual risk factors
    riskFactors.overqualification = assessOverqualificationRisk(candidate, job);
    riskFactors.underqualification = assessUnderqualificationRisk(candidate, job);
    riskFactors.skillMismatch = assessSkillMismatchRisk(candidate, job);
    riskFactors.jobHopping = assessJobHoppingRisk(candidate, historicalData);
    riskFactors.culturalFit = assessCulturalFitRisk(candidate, job);
    riskFactors.salaryExpectations = assessSalaryExpectationsRisk(candidate, job);
    riskFactors.commute = assessCommuteRisk(candidate, job);
    riskFactors.careerGaps = assessCareerGapsRisk(candidate);
    riskFactors.retentionRisk = assessRetentionRisk(candidate, job);

    // Calculate weighted total risk
    const weights = {
      overqualification: 0.15,
      underqualification: 0.18,
      skillMismatch: 0.20,
      jobHopping: 0.15,
      culturalFit: 0.10,
      salaryExpectations: 0.10,
      commute: 0.05,
      careerGaps: 0.05,
      retentionRisk: 0.02,
    };

    for (const [factor, score] of Object.entries(riskFactors)) {
      totalRiskScore += score.score * weights[factor];
    }

    totalRiskScore = Math.round(totalRiskScore);

    // Normalize to 0-100
    totalRiskScore = Math.max(0, Math.min(100, totalRiskScore));

    // Determine risk level
    const riskLevel = determineRiskLevel(totalRiskScore);

    // Predict attrition probability
    const attritionProbability = calculateAttritionProbability(totalRiskScore, riskFactors);

    // Get top risk factors
    const topRiskFactors = getTopRiskFactors(riskFactors, 5);

    // Generate mitigation strategies
    const mitigationStrategies = generateMitigationStrategies(riskFactors, job);

    // Predicted tenure
    const predictedTenure = predictTenure(totalRiskScore, riskFactors, candidate);

    return {
      overall_risk_score: totalRiskScore,
      risk_level: riskLevel,
      attrition_probability: attritionProbability,
      predicted_tenure_months: predictedTenure.months,
      tenure_confidence: predictedTenure.confidence,
      risk_factors: riskFactors,
      top_risk_factors: topRiskFactors,
      mitigation_strategies: mitigationStrategies,
      recommendation: generateRiskRecommendation(riskLevel, totalRiskScore, topRiskFactors),
      assessment_timestamp: new Date(),
    };
  } catch (error) {
    console.error('Risk prediction error:', error);
    throw error;
  }
};

/**
 * Assess overqualification risk
 */
const assessOverqualificationRisk = (candidate, job) => {
  const candidateYears = candidate.experience || 0;
  const requiredYears = job.experienceRequired || 1;

  let score = 0;
  const factors = [];

  if (candidateYears > requiredYears * 2) {
    score = 70;
    factors.push('Significantly overqualified for the role');
    factors.push('May leave for better opportunities');
  } else if (candidateYears > requiredYears * 1.5) {
    score = 40;
    factors.push('Moderately overqualified');
  } else {
    score = 10;
    factors.push('Experience level appropriate');
  }

  // Check education level
  const candidateEducation = candidate.education || '';
  const jobEducation = job.educationLevel || '';

  if (candidateEducation.includes('PhD') && !jobEducation.includes('PhD')) {
    score += 15;
    factors.push('PhD holder for non-PhD role');
  } else if (candidateEducation.includes('Master') && !jobEducation.includes('Master')) {
    score += 10;
    factors.push('Master degree for entry-level role');
  }

  return {
    score: Math.min(100, score),
    explanation: 'Candidate may outgrow the position and seek advancement opportunities',
    factors,
  };
};

/**
 * Assess underqualification risk
 */
const assessUnderqualificationRisk = (candidate, job) => {
  const candidateYears = candidate.experience || 0;
  const requiredYears = job.experienceRequired || 0;
  const candidateSkills = (candidate.skills || []).map(s => s.toLowerCase());
  const requiredSkills = (job.requiredSkills || []).map(s => s.toLowerCase());

  let score = 0;
  const factors = [];

  // Experience gap
  if (requiredYears > 0 && candidateYears < requiredYears) {
    const gap = requiredYears - candidateYears;
    score += Math.min(50, gap * 15);
    factors.push(`Missing ${gap} year(s) of required experience`);
  }

  // Skill gap
  const missingSkills = requiredSkills.filter(s => !candidateSkills.includes(s));
  if (missingSkills.length > 0) {
    score += Math.min(40, missingSkills.length * 10);
    factors.push(`Missing critical skills: ${missingSkills.slice(0, 3).join(', ')}`);
  }

  // Education gap
  const candidateEducation = candidate.education || '';
  const requiredEducation = job.educationLevel || '';

  if (requiredEducation && !candidateEducation) {
    score += 20;
    factors.push('Does not meet education requirements');
  }

  return {
    score: Math.min(100, score),
    explanation: 'Candidate may struggle with job responsibilities and performance',
    factors,
  };
};

/**
 * Assess skill mismatch risk
 */
const assessSkillMismatchRisk = (candidate, job) => {
  const candidateSkills = (candidate.skills || []).map(s => s.toLowerCase());
  const requiredSkills = (job.requiredSkills || []).map(s => s.toLowerCase());
  const preferredSkills = (job.preferredSkills || []).map(s => s.toLowerCase());

  if (requiredSkills.length === 0) {
    return { score: 0, explanation: 'No specific skills required', factors: [] };
  }

  const matchedRequired = requiredSkills.filter(s => candidateSkills.includes(s));
  const mismatchRate = 1 - (matchedRequired.length / requiredSkills.length);

  const score = Math.round(mismatchRate * 100);
  const factors = [];

  if (mismatchRate > 0.5) {
    factors.push('Significant skill gap exists');
  } else if (mismatchRate > 0.25) {
    factors.push('Some skill gaps present');
  } else {
    factors.push('Skill alignment is good');
  }

  if (preferredSkills.length > 0) {
    const matchedPreferred = preferredSkills.filter(s => candidateSkills.includes(s));
    if (matchedPreferred.length === 0) {
      factors.push('None of the preferred skills present');
    }
  }

  return {
    score,
    explanation: `Candidate has ${matchedRequired.length}/${requiredSkills.length} required skills`,
    factors,
  };
};

/**
 * Assess job hopping risk
 */
const assessJobHoppingRisk = (candidate, historicalData) => {
  const jobHoppingHistory = historicalData.jobHistory || [];
  let score = 20; // Base risk
  const factors = [];

  if (jobHoppingHistory.length === 0) {
    return {
      score: 20,
      explanation: 'No previous job hopping patterns detected',
      factors: ['Fresh candidate or limited history'],
    };
  }

  // Analyze tenure in previous positions
  const tenures = jobHoppingHistory.map(job => job.duration || 0);
  const avgTenure = tenures.reduce((a, b) => a + b, 0) / tenures.length;

  if (avgTenure < 1) {
    score = 85;
    factors.push('Very high job hopping - average tenure less than 1 year');
  } else if (avgTenure < 2) {
    score = 65;
    factors.push('High job hopping - average tenure less than 2 years');
  } else if (avgTenure < 3) {
    score = 40;
    factors.push('Moderate job hopping - average tenure less than 3 years');
  } else {
    score = 15;
    factors.push('Stable tenure history');
  }

  // Check for quick terminations
  const quickTerminations = tenures.filter(t => t < 0.5).length;
  if (quickTerminations > 0) {
    score += quickTerminations * 10;
    factors.push(`${quickTerminations} position(s) terminated within 6 months`);
  }

  return {
    score: Math.min(100, score),
    explanation: `Average job tenure: ${avgTenure.toFixed(1)} years`,
    factors,
  };
};

/**
 * Assess cultural fit risk
 */
const assessCulturalFitRisk = (candidate, job) => {
  let score = 30; // Base risk
  const factors = [];

  // Check work style alignment
  if (candidate.workStyle !== job.companyWorkStyle) {
    score += 20;
    factors.push('Work style mismatch with company culture');
  } else {
    factors.push('Work style aligns with company');
  }

  // Check team size preference
  if (candidate.teamSizePreference && job.teamSize) {
    if (candidate.teamSizePreference.toLowerCase() !== job.teamSize.toLowerCase()) {
      score += 15;
      factors.push('Team size preference mismatch');
    }
  }

  // Check industry experience
  if (candidate.industries && job.industry) {
    const candidateIndustries = candidate.industries.map(i => i.toLowerCase());
    if (!candidateIndustries.includes(job.industry.toLowerCase())) {
      score += 15;
      factors.push('No experience in target industry');
    }
  }

  // Check career goals alignment
  if (candidate.careerGoals && job.growthOpportunities) {
    factors.push('Career growth opportunities present');
  }

  return {
    score: Math.min(100, score),
    explanation: 'Cultural fit can significantly impact retention',
    factors,
  };
};

/**
 * Assess salary expectations risk
 */
const assessSalaryExpectationsRisk = (candidate, job) => {
  const candidateSalary = candidate.expectedSalary || 0;
  const jobMin = job.salaryMin || 0;
  const jobMax = job.salaryMax || 0;

  if (!jobMin || !jobMax) {
    return {
      score: 20,
      explanation: 'Salary range not specified',
      factors: ['Cannot assess salary risk'],
    };
  }

  if (!candidateSalary) {
    return {
      score: 15,
      explanation: 'Candidate salary expectations not specified',
      factors: ['May discuss during negotiation'],
    };
  }

  const midPoint = (jobMin + jobMax) / 2;
  let score = 0;
  const factors = [];

  if (candidateSalary > jobMax) {
    const excess = candidateSalary - jobMax;
    score = Math.min(80, (excess / jobMax) * 100);
    factors.push(`Expects $${excess} above maximum budget`);
    factors.push('Candidate may leave if salary expectations not met');
  } else if (candidateSalary < jobMin) {
    factors.push('Expectations below minimum - low risk');
  } else {
    factors.push('Salary expectations within budget');
  }

  return {
    score,
    explanation: `Expected salary: $${candidateSalary}, Budget: $${jobMin}-$${jobMax}`,
    factors,
  };
};

/**
 * Assess commute risk
 */
const assessCommuteRisk = (candidate, job) => {
  if (job.jobType === 'remote' || job.jobType === 'hybrid') {
    return {
      score: 0,
      explanation: 'Remote or hybrid position - commute not applicable',
      factors: ['No commute concerns'],
    };
  }

  const candidateLocation = (candidate.location || '').toLowerCase();
  const jobLocation = (job.location || '').toLowerCase();

  if (candidateLocation === jobLocation) {
    return {
      score: 5,
      explanation: 'Same location - minimal commute risk',
      factors: ['No relocation required'],
    };
  }

  return {
    score: 30,
    explanation: 'Location mismatch - relocation may be required',
    factors: ['Candidate may need to relocate'],
  };
};

/**
 * Assess career gaps risk
 */
const assessCareerGapsRisk = (candidate) => {
  const gaps = candidate.careerGaps || [];
  let score = 0;
  const factors = [];

  if (gaps.length === 0) {
    return {
      score: 0,
      explanation: 'No career gaps detected',
      factors: ['Continuous employment history'],
    };
  }

  for (const gap of gaps) {
    const gapDuration = gap.duration || 0;
    if (gapDuration > 12) {
      score += 20;
      factors.push(`Extended gap of ${gapDuration} months`);
    } else if (gapDuration > 6) {
      score += 10;
      factors.push(`Gap of ${gapDuration} months detected`);
    }
  }

  return {
    score: Math.min(60, score),
    explanation: 'Career gaps may indicate various factors',
    factors,
  };
};

/**
 * Assess retention risk
 */
const assessRetentionRisk = (candidate, job) => {
  let score = 0;
  const factors = [];

  // Career progression
  if (job.title && candidate.currentTitle) {
    if (job.title === candidate.currentTitle) {
      score += 30;
      factors.push('Same title - no advancement opportunity');
    }
  }

  // Learning opportunities
  if (!job.trainingBudget && !job.certificationSupport) {
    score += 10;
    factors.push('Limited learning opportunities');
  }

  // Performance bonus
  if (!job.performanceBonus) {
    score += 5;
    factors.push('No performance bonus structure');
  }

  return {
    score,
    explanation: 'Retention factors based on job characteristics',
    factors,
  };
};

/**
 * Determine risk level from score
 */
const determineRiskLevel = (score) => {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
};

/**
 * Calculate attrition probability (0-1)
 */
const calculateAttritionProbability = (riskScore, riskFactors) => {
  // Convert risk score to probability
  // 0-30 = 5-10%, 31-50 = 15-30%, 51-70 = 35-65%, 71-100 = 70-95%
  let probability = riskScore / 100; // 0-1 scale

  // Adjust based on specific risk factors
  if (riskFactors.jobHopping && riskFactors.jobHopping.score > 70) {
    probability += 0.15;
  }

  if (riskFactors.overqualification && riskFactors.overqualification.score > 60) {
    probability += 0.10;
  }

  if (riskFactors.salaryExpectations && riskFactors.salaryExpectations.score > 50) {
    probability += 0.08;
  }

  return Math.min(1, Math.round(probability * 100) / 100);
};

/**
 * Get top risk factors
 */
const getTopRiskFactors = (riskFactors, limit = 5) => {
  return Object.entries(riskFactors)
    .map(([name, data]) => ({
      factor: name,
      score: data.score,
      explanation: data.explanation,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};

/**
 * Generate mitigation strategies
 */
const generateMitigationStrategies = (riskFactors, job) => {
  const strategies = [];

  // Overqualification mitigation
  if (riskFactors.overqualification.score > 50) {
    strategies.push({
      risk: 'Overqualification',
      strategies: [
        'Clearly define advancement opportunities within the company',
        'Discuss leadership/management track',
        'Offer special projects or stretch assignments',
        'Ensure competitive compensation',
      ],
    });
  }

  // Underqualification mitigation
  if (riskFactors.underqualification.score > 50) {
    strategies.push({
      risk: 'Underqualification',
      strategies: [
        'Provide comprehensive onboarding and training program',
        'Assign a strong mentor/buddy',
        'Set clear learning goals and development plan',
        'Schedule regular check-ins for first 90 days',
      ],
    });
  }

  // Skill mismatch mitigation
  if (riskFactors.skillMismatch.score > 50) {
    strategies.push({
      risk: 'Skill Mismatch',
      strategies: [
        'Offer technical training and skill development',
        'Provide access to online courses and certifications',
        'Pair with experienced team members for knowledge transfer',
      ],
    });
  }

  // Job hopping mitigation
  if (riskFactors.jobHopping.score > 50) {
    strategies.push({
      risk: 'Job Hopping History',
      strategies: [
        'Clearly communicate growth opportunities',
        'Discuss career stability and long-term vision',
        'Offer transparent career progression path',
        'Set performance milestones and recognition',
      ],
    });
  }

  // Cultural fit mitigation
  if (riskFactors.culturalFit.score > 50) {
    strategies.push({
      risk: 'Cultural Fit',
      strategies: [
        'Arrange team introductions and culture immersion',
        'Discuss company values and work environment',
        'Connect with employees in similar background/experience',
        'Plan team building activities',
      ],
    });
  }

  return strategies;
};

/**
 * Predict tenure
 */
const predictTenure = (riskScore, riskFactors, candidate) => {
  let months = 48; // Default 4 years

  if (riskScore >= 70) {
    months = Math.max(6, months - 30); // 6 months - 1.5 years
  } else if (riskScore >= 50) {
    months = Math.max(12, months - 18); // 1-3 years
  } else if (riskScore >= 30) {
    months = Math.max(24, months - 6); // 2-4 years
  }

  // Adjust based on job hopping
  if (riskFactors.jobHopping.score > 70) {
    months = Math.max(6, months - 12);
  }

  const confidence = Math.max(0.5, 1 - riskScore / 200);

  return {
    months: Math.round(months),
    confidence: Math.round(confidence * 100),
  };
};

/**
 * Generate risk recommendation
 */
const generateRiskRecommendation = (riskLevel, riskScore, topFactors) => {
  let recommendation = '';

  if (riskLevel === 'high') {
    recommendation = `High risk candidate (${riskScore}% risk score). `;
    recommendation += 'Recommend careful evaluation of risk factors before hiring. ';
    recommendation += 'If proceeding, implement comprehensive mitigation strategies.';
  } else if (riskLevel === 'medium') {
    recommendation = `Medium risk candidate (${riskScore}% risk score). `;
    recommendation += 'Proceed with standard onboarding and monitoring. ';
    recommendation += 'Address identified risk factors proactively.';
  } else {
    recommendation = `Low risk candidate (${riskScore}% risk score). `;
    recommendation += 'Good fit for the position. Standard hiring process is appropriate.';
  }

  return recommendation;
};

export default {
  predictHiringRisk,
};
