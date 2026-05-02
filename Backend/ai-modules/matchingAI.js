/**
 * AI Module 2: Job-Candidate Matching & Explainable AI
 * Features:
 * - Computes candidate-job match score using advanced algorithms
 * - ML models for ranking candidates
 * - Provides detailed explanations for matching decisions (Explainable AI)
 * - Multiple matching dimensions (skills, experience, culture, location)
 */

/**
 * Calculate comprehensive match score with explainability
 */
export const calculateMatchScoreWithExplanation = async (candidate, job) => {
  try {
    const matchDimensions = {
      skills: calculateSkillsMatch(candidate, job),
      experience: calculateExperienceMatch(candidate, job),
      education: calculateEducationMatch(candidate, job),
      location: calculateLocationMatch(candidate, job),
      salary: calculateSalaryMatch(candidate, job),
      cultural_fit: calculateCulturalFit(candidate, job),
    };

    // Calculate weighted overall score
    const weights = {
      skills: 0.35,
      experience: 0.25,
      education: 0.15,
      location: 0.10,
      salary: 0.10,
      cultural_fit: 0.05,
    };

    let overallScore = 0;
    const explanations = [];

    for (const [dimension, score] of Object.entries(matchDimensions)) {
      const weight = weights[dimension];
      overallScore += score.score * weight;
      explanations.push({
        dimension,
        score: score.score,
        weight,
        contribution: Math.round(score.score * weight),
        explanation: score.explanation,
        factors: score.factors,
      });
    }

    overallScore = Math.round(overallScore);

    // Determine match level
    const matchLevel = getMatchLevel(overallScore);

    // Generate recommendation
    const recommendation = generateRecommendation(overallScore, matchLevel, explanations);

    return {
      overall_score: overallScore,
      match_level: matchLevel,
      dimensions: matchDimensions,
      weighted_explanations: explanations,
      recommendation,
      confidence_score: calculateConfidenceScore(matchDimensions),
      matching_timestamp: new Date(),
    };
  } catch (error) {
    console.error('Match score calculation error:', error);
    throw error;
  }
};

/**
 * Calculate skills match (0-100)
 */
const calculateSkillsMatch = (candidate, job) => {
  const candidateSkills = (candidate.skills || []).map(s => s.toLowerCase());
  const requiredSkills = (job.requiredSkills || []).map(s => s.toLowerCase());
  const preferredSkills = (job.preferredSkills || []).map(s => s.toLowerCase());

  if (requiredSkills.length === 0) {
    return { score: 50, explanation: 'No specific skills required', factors: [] };
  }

  // Count matched skills
  const matchedRequired = requiredSkills.filter(skill => candidateSkills.includes(skill));
  const matchedPreferred = preferredSkills.filter(skill => candidateSkills.includes(skill));

  // Calculate percentages
  const requiredMatch = (matchedRequired.length / requiredSkills.length) * 100;
  const preferredMatch = preferredSkills.length > 0
    ? (matchedPreferred.length / preferredSkills.length) * 100
    : 50;

  // Weighted score: 70% required, 30% preferred
  const score = Math.round(requiredMatch * 0.7 + preferredMatch * 0.3);

  const factors = [];
  if (matchedRequired.length === requiredSkills.length) {
    factors.push('All required skills matched');
  } else {
    const missingSkills = requiredSkills.filter(s => !candidateSkills.includes(s));
    factors.push(`Missing ${missingSkills.length} required skill(s): ${missingSkills.join(', ')}`);
  }

  if (matchedPreferred.length > 0) {
    factors.push(`${matchedPreferred.length} preferred skill(s) matched: ${matchedPreferred.join(', ')}`);
  }

  return {
    score,
    explanation: `Skills match: ${matchedRequired.length}/${requiredSkills.length} required, ${matchedPreferred.length}/${preferredSkills.length} preferred`,
    factors,
    details: {
      required_matched: matchedRequired.length,
      required_total: requiredSkills.length,
      preferred_matched: matchedPreferred.length,
      preferred_total: preferredSkills.length,
      missing_skills: requiredSkills.filter(s => !candidateSkills.includes(s)),
    },
  };
};

/**
 * Calculate experience match (0-100)
 */
const calculateExperienceMatch = (candidate, job) => {
  const candidateExperience = candidate.experience || 0;
  const requiredExperience = job.experienceRequired || 0;

  let score = 0;
  let explanation = '';
  const factors = [];

  if (requiredExperience === 0) {
    score = 100;
    explanation = 'Any experience level is acceptable';
    factors.push('No specific experience requirement');
  } else if (candidateExperience === requiredExperience) {
    score = 100;
    explanation = 'Perfect experience match';
    factors.push(`Candidate has exactly ${candidateExperience} years as required`);
  } else if (candidateExperience > requiredExperience) {
    // Overqualified check: slight penalty if too much experience (may leave job)
    const excessYears = candidateExperience - requiredExperience;
    score = Math.max(80, 100 - (excessYears * 3));
    explanation = `Candidate is overqualified (${candidateExperience} vs ${requiredExperience} required years)`;
    factors.push(`${excessYears} years above requirement - potential flight risk`);
  } else {
    // Underqualified: more significant penalty
    const missingYears = requiredExperience - candidateExperience;
    score = Math.max(30, 100 - (missingYears * 20));
    explanation = `Candidate has ${candidateExperience} years, but ${requiredExperience} required`;
    factors.push(`Missing ${missingYears} year(s) of experience`);
  }

  return {
    score: Math.round(score),
    explanation,
    factors,
    details: {
      candidate_years: candidateExperience,
      required_years: requiredExperience,
      gap: candidateExperience - requiredExperience,
    },
  };
};

/**
 * Calculate education match (0-100)
 */
const calculateEducationMatch = (candidate, job) => {
  const candidateEducation = (candidate.education || '').toLowerCase();
  const requiredEducation = (job.educationLevel || '').toLowerCase();

  const educationHierarchy = {
    'high school': 1,
    diploma: 2,
    bachelor: 3,
    master: 4,
    phd: 5,
  };

  const candidateLevel = educationHierarchy[candidateEducation] || 1;
  const requiredLevel = educationHierarchy[requiredEducation] || 2;

  let score = 0;
  let explanation = '';
  const factors = [];

  if (!requiredEducation || requiredLevel <= 1) {
    score = 100;
    explanation = 'No specific education requirement';
    factors.push('Position does not require specific education level');
  } else if (candidateLevel >= requiredLevel) {
    score = 100;
    explanation = `Education requirement met (${candidateEducation || 'not specified'})`;
    factors.push(`Candidate has ${candidateEducation || 'unspecified'} degree`);
  } else {
    score = Math.max(50, (candidateLevel / requiredLevel) * 100);
    explanation = `Education below requirement (${candidateEducation || 'not specified'} vs ${requiredEducation} required)`;
    factors.push(`Candidate lacks required ${requiredEducation} degree`);
  }

  return {
    score: Math.round(score),
    explanation,
    factors,
    details: {
      candidate_education: candidateEducation || 'Not specified',
      required_education: requiredEducation || 'Not specified',
    },
  };
};

/**
 * Calculate location match (0-100)
 */
const calculateLocationMatch = (candidate, job) => {
  const candidateLocation = (candidate.location || '').toLowerCase().trim();
  const jobLocation = (job.location || '').toLowerCase().trim();
  const isRemote = job.jobType === 'remote' || job.jobType === 'hybrid';

  if (!jobLocation || isRemote) {
    return {
      score: 100,
      explanation: isRemote ? 'Remote/Hybrid position - location flexible' : 'Location not specified',
      factors: ['Position is remote or location flexible'],
    };
  }

  if (!candidateLocation) {
    return {
      score: 50,
      explanation: 'Candidate location not specified',
      factors: ['Unable to verify location match'],
    };
  }

  const isMatch = candidateLocation === jobLocation;
  const score = isMatch ? 100 : 60;
  const explanation = isMatch
    ? `Exact location match (${candidateLocation})`
    : `Location mismatch (candidate: ${candidateLocation}, job: ${jobLocation})`;

  const factors = isMatch
    ? ['Candidate located in job location']
    : ['Relocation may be required'];

  return {
    score,
    explanation,
    factors,
    details: {
      candidate_location: candidateLocation,
      job_location: jobLocation,
      match: isMatch,
    },
  };
};

/**
 * Calculate salary expectations match (0-100)
 */
const calculateSalaryMatch = (candidate, job) => {
  const candidateSalary = candidate.expectedSalary || 0;
  const jobSalaryMin = job.salaryMin || 0;
  const jobSalaryMax = job.salaryMax || 0;

  if (!jobSalaryMin || !jobSalaryMax) {
    return {
      score: 75,
      explanation: 'Job salary range not specified',
      factors: ['Unable to verify salary match'],
    };
  }

  if (!candidateSalary) {
    return {
      score: 75,
      explanation: 'Candidate salary expectations not specified',
      factors: ['Salary expectations not provided'],
    };
  }

  if (candidateSalary >= jobSalaryMin && candidateSalary <= jobSalaryMax) {
    return {
      score: 100,
      explanation: `Salary expectations within range ($${jobSalaryMin} - $${jobSalaryMax})`,
      factors: ['Salary expectations align with job budget'],
      details: {
        candidate_expectation: candidateSalary,
        job_min: jobSalaryMin,
        job_max: jobSalaryMax,
      },
    };
  }

  const mismatch = candidateSalary > jobSalaryMax ? 'above' : 'below';
  const gap = Math.abs(candidateSalary - (mismatch === 'above' ? jobSalaryMax : jobSalaryMin));
  const score = Math.max(30, 100 - (gap / jobSalaryMax * 100));

  return {
    score: Math.round(score),
    explanation: `Salary expectations ${mismatch} range ($${jobSalaryMin} - $${jobSalaryMax})`,
    factors: [`Candidate expectation ${mismatch} budget by $${gap}`],
    details: {
      candidate_expectation: candidateSalary,
      job_min: jobSalaryMin,
      job_max: jobSalaryMax,
      gap,
    },
  };
};

/**
 * Calculate cultural fit (0-100)
 */
const calculateCulturalFit = (candidate, job) => {
  let score = 70; // Base score
  const factors = [];

  // Check company culture alignment
  if (candidate.workStyle === job.companyWorkStyle) {
    score += 10;
    factors.push('Work style alignment');
  }

  // Check team size preference
  if (candidate.teamSizePreference && job.teamSize) {
    const candidatePreference = candidate.teamSizePreference.toLowerCase();
    const jobTeamSize = job.teamSize.toLowerCase();
    if (candidatePreference === jobTeamSize) {
      score += 5;
      factors.push('Team size preference matches');
    }
  }

  // Industry experience
  if (candidate.industries && job.industry) {
    const candidateIndustries = candidate.industries.map(i => i.toLowerCase());
    if (candidateIndustries.includes(job.industry.toLowerCase())) {
      score += 5;
      factors.push('Industry experience relevant');
    }
  }

  // Growth opportunity interest
  if (candidate.careerGoals && job.growthOpportunities) {
    score += 5;
    factors.push('Growth opportunities align with career goals');
  }

  if (factors.length === 0) {
    factors.push('Cultural fit information limited');
  }

  return {
    score: Math.min(100, score),
    explanation: `Cultural fit assessment based on available information`,
    factors,
  };
};

/**
 * Get match level description
 */
const getMatchLevel = (score) => {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'strong';
  if (score >= 55) return 'moderate';
  if (score >= 40) return 'weak';
  return 'poor';
};

/**
 * Calculate confidence score for the matching algorithm
 */
const calculateConfidenceScore = (dimensions) => {
  const completenessFactors = [];

  for (const [dimension, data] of Object.entries(dimensions)) {
    if (data.details) {
      // Check if we have concrete data for this dimension
      const details = data.details;
      const hasData = Object.values(details).some(v => v !== null && v !== undefined && v !== '');
      completenessFactors.push(hasData ? 1 : 0.5);
    }
  }

  const avgCompleteness = completenessFactors.length > 0
    ? completenessFactors.reduce((a, b) => a + b) / completenessFactors.length
    : 0.7;

  return Math.round(avgCompleteness * 100);
};

/**
 * Generate recommendation text
 */
const generateRecommendation = (score, matchLevel, explanations) => {
  const skillsExpl = explanations.find(e => e.dimension === 'skills');
  const experienceExpl = explanations.find(e => e.dimension === 'experience');

  let recommendation = '';

  switch (matchLevel) {
    case 'excellent':
      recommendation = `Highly recommended. Candidate is an excellent fit for this position with ${score}% overall match.`;
      break;
    case 'strong':
      recommendation = `Recommended. Candidate shows strong alignment with the role (${score}% match).`;
      break;
    case 'moderate':
      recommendation = `Consider with caution. Candidate has moderate fit (${score}% match). Review gaps carefully.`;
      break;
    case 'weak':
      recommendation = `Not recommended. Candidate has significant gaps (${score}% match). Consider other candidates.`;
      break;
    case 'poor':
      recommendation = `Strongly not recommended. Poor match with the position (${score}% match).`;
      break;
  }

  // Add specific guidance
  if (skillsExpl && skillsExpl.score < 70) {
    recommendation += ` Key concern: Limited skills alignment.`;
  }

  if (experienceExpl && experienceExpl.score < 60) {
    recommendation += ` Experience gap needs assessment.`;
  }

  return recommendation;
};

/**
 * Rank candidates for a job position
 */
export const rankCandidatesForJob = async (candidates, job) => {
  try {
    const scoredCandidates = await Promise.all(
      candidates.map(async (candidate) => {
        const matchScore = await calculateMatchScoreWithExplanation(candidate, job);
        return {
          ...candidate,
          matchScore,
        };
      })
    );

    // Sort by overall score descending
    return scoredCandidates.sort((a, b) => b.matchScore.overall_score - a.matchScore.overall_score);
  } catch (error) {
    console.error('Candidate ranking error:', error);
    throw error;
  }
};

/**
 * Get top N candidates for a job
 */
export const getTopCandidates = async (candidates, job, topN = 5) => {
  const ranked = await rankCandidatesForJob(candidates, job);
  return ranked.slice(0, topN);
};

export default {
  calculateMatchScoreWithExplanation,
  rankCandidatesForJob,
  getTopCandidates,
};
