/**
 * Interview evaluation: answer scoring, AI-style narrative analysis (communication &
 * behavioral cues), soft-skill dimensions, and certification validation (authenticity,
 * relevance, validity). Heuristic engine suitable for demos; swap `runAiAnalysis` for an LLM call.
 */

const KNOWN_ISSUERS = new Set([
  'aws',
  'amazon web services',
  'microsoft',
  'google',
  'cisco',
  'comptia',
  'pmi',
  'project management institute',
  'oracle',
  'red hat',
  'isc2',
  '(isc)2',
  'eccouncil',
  'salesforce',
  'docker',
  'kubernetes',
  'linux foundation',
]);

const BEHAVIORAL_PATTERNS = {
  teamwork: /\b(we|team|collaborat|together|stakeholder|peer|mentor)\b/i,
  ownership: /\b(i\s+(led|owned|delivered|implemented|drove|championed)|my\s+responsibility|accountable)\b/i,
  adaptability: /\b(pivot|learned|unfamiliar|new\s+stack|migrated|legacy|changed|adapt)\b/i,
  stressHandling: /\b(deadline|pressure|incident|outage|urgent|prioritiz|trade-?off)\b/i,
};

/**
 * @param {Array<{ questionId?: string, answer?: string, confidence?: number }>} answers
 * @param {Array<{ id?: string, text?: string }>} questions
 * @param {{ jobTitle?: string, requiredSkills?: string[] }} [jobContext]
 */
export const runAiAnalysis = (answers, questions, jobContext = {}) => {
  const combined = (answers || [])
    .map(a => (a && a.answer ? String(a.answer) : ''))
    .join('\n')
    .trim();

  const communicationCues = scoreCommunicationCues(combined);
  const behavioralCues = scoreBehavioralCues(combined);
  const softSkills = deriveSoftSkills(communicationCues, behavioralCues, answers || []);

  return {
    summary: buildNarrativeSummary(communicationCues, behavioralCues, softSkills, jobContext),
    communicationCues,
    behavioralCues,
    softSkills,
    analysisMethod: 'heuristic-v1',
    analyzedAt: new Date().toISOString(),
  };
};

function scoreCommunicationCues(text) {
  if (!text) {
    return {
      score: 25,
      clarity: 25,
      structure: 20,
      vocabularyDepth: 20,
      signals: ['Very limited text for prosody/structure inference'],
    };
  }

  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
  const words = text.split(/\s+/).filter(Boolean);
  const avgWordsPerSentence = sentences.length ? words.length / sentences.length : words.length;

  let clarity = 55;
  if (avgWordsPerSentence >= 12 && avgWordsPerSentence <= 32) clarity += 20;
  else if (avgWordsPerSentence < 6) clarity -= 15;

  let structure = 50;
  if (sentences.length >= 3) structure += 25;
  if (/\b(first|second|finally|in\s+summary|step\s*\d)\b/i.test(text)) structure += 15;

  let vocabularyDepth = 50;
  const uniqueRatio = words.length ? new Set(words.map(w => w.toLowerCase())).size / words.length : 0;
  if (uniqueRatio > 0.55) vocabularyDepth += 20;
  if (/\b(architecture|scalability|trade-?off|constraint|metric|sla|kpi)\b/i.test(text)) vocabularyDepth += 15;

  const signals = [];
  if (sentences.length >= 4) signals.push('Multi-sentence responses suggest organized expression');
  if (/\b(example|for\s+instance|specifically)\b/i.test(text)) signals.push('Uses concrete framing / examples');
  if (/\b(i\s+would|approach|plan)\b/i.test(text)) signals.push('Shows explicit reasoning / planning language');

  const score = Math.round(Math.min(100, (clarity + structure + vocabularyDepth) / 3));
  return {
    score,
    clarity: Math.min(100, Math.round(clarity)),
    structure: Math.min(100, Math.round(structure)),
    vocabularyDepth: Math.min(100, Math.round(vocabularyDepth)),
    signals: signals.length ? signals : ['Neutral communication signals from text-only analysis'],
  };
}

function scoreBehavioralCues(text) {
  const evidence = { teamwork: [], ownership: [], adaptability: [], stressHandling: [] };
  const dims = { teamwork: 45, ownership: 45, adaptability: 45, stressHandling: 45 };

  if (!text) {
    return {
      score: 30,
      dimensions: dims,
      evidence: [],
      note: 'Insufficient transcript for behavioral inference',
    };
  }

  for (const [key, re] of Object.entries(BEHAVIORAL_PATTERNS)) {
    const m = text.match(re);
    if (m) {
      dims[key] = Math.min(95, dims[key] + 28);
      evidence[key].push(`Matched collaborative/behavioral language: "${m[0].slice(0, 80)}"`);
    }
  }

  const dimensionScores = Object.values(dims);
  const score = Math.round(dimensionScores.reduce((a, b) => a + b, 0) / dimensionScores.length);

  const flatEvidence = Object.entries(evidence).flatMap(([k, arr]) =>
    arr.map(line => ({ dimension: k, detail: line }))
  );

  return {
    score,
    dimensions: {
      teamwork: dims.teamwork,
      ownership: dims.ownership,
      adaptability: dims.adaptability,
      stressHandling: dims.stressHandling,
    },
    evidence: flatEvidence.length ? flatEvidence : [{ dimension: 'general', detail: 'No strong behavioral markers detected in text' }],
  };
}

function deriveSoftSkills(communicationCues, behavioralCues, answers) {
  const avgReportedConfidence =
    answers.length > 0
      ? Math.round(
          answers.reduce((s, a) => s + (typeof a.confidence === 'number' ? a.confidence : 50), 0) /
            answers.length
        )
      : 50;

  const collaboration = Math.round((behavioralCues.dimensions.teamwork + communicationCues.structure) / 2);
  const problemSolving = Math.round(
    (behavioralCues.dimensions.ownership + behavioralCues.dimensions.adaptability + communicationCues.clarity) / 3
  );
  const professionalism = Math.round(
    (communicationCues.score + behavioralCues.dimensions.stressHandling + avgReportedConfidence) / 3
  );

  return {
    collaboration: Math.min(100, collaboration),
    problemSolving: Math.min(100, problemSolving),
    professionalism: Math.min(100, professionalism),
  };
}

function buildNarrativeSummary(communicationCues, behavioralCues, softSkills, jobContext) {
  const parts = [];
  parts.push(
    `Communication analysis (text-derived): clarity ${communicationCues.clarity}/100, structure ${communicationCues.structure}/100.`
  );
  parts.push(
    `Behavioral inference: teamwork ${behavioralCues.dimensions.teamwork}/100, ownership ${behavioralCues.dimensions.ownership}/100, adaptability ${behavioralCues.dimensions.adaptability}/100.`
  );
  parts.push(
    `Soft-skill composite: collaboration ${softSkills.collaboration}/100, problem-solving ${softSkills.problemSolving}/100, professionalism ${softSkills.professionalism}/100.`
  );
  if (jobContext.jobTitle) {
    parts.push(`Context: role "${jobContext.jobTitle}" — align follow-up probes with stated gaps in evidence.`);
  }
  return parts.join(' ');
}

/**
 * @param {Array<{ name: string, issuer: string, issueYear?: number, expiresAt?: string, credentialId?: string, skills?: string[] }>} certifications
 * @param {{ jobTitle?: string, requiredSkills?: string[] }} jobContext
 */
export const validateCertifications = (certifications, jobContext = {}) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const required = (jobContext.requiredSkills || [])
    .map(s => String(s).toLowerCase())
    .filter(Boolean);
  const jobBlob = [jobContext.jobTitle || '', ...required].join(' ').toLowerCase();

  const items = (certifications || []).map(raw => {
    const name = String(raw.name || '').trim();
    const issuer = String(raw.issuer || '').trim();
    const issueYear = raw.issueYear != null ? Number(raw.issueYear) : null;
    const expiresAt = raw.expiresAt ? new Date(raw.expiresAt) : null;
    const credentialId = raw.credentialId ? String(raw.credentialId).trim() : '';

    const authenticity = scoreAuthenticity(issuer, credentialId, issueYear, currentYear);
    const relevance = scoreRelevance(name, issuer, jobBlob, raw.skills);
    const validity = scoreValidity(issueYear, expiresAt, now, currentYear);

    const trust = Math.round((authenticity.score + relevance.score + validity.score) / 3);

    return {
      name,
      issuer,
      issueYear,
      expiresAt: expiresAt && !Number.isNaN(expiresAt.getTime()) ? expiresAt.toISOString() : null,
      credentialId: credentialId || undefined,
      authenticity: { level: authenticity.level, score: authenticity.score, reasons: authenticity.reasons },
      relevance: { level: relevance.level, score: relevance.score, reasons: relevance.reasons },
      validity: { level: validity.level, score: validity.score, reasons: validity.reasons },
      trustScore: trust,
    };
  });

  const overallTrustScore =
    items.length === 0
      ? 0
      : Math.round(items.reduce((s, i) => s + i.trustScore, 0) / items.length);

  return {
    items,
    overallTrustScore,
    validatedAt: now.toISOString(),
    policy: 'issuer-allowlist+year-window+role-keyword-overlap (replace with vendor API in production)',
  };
};

function scoreAuthenticity(issuer, credentialId, issueYear, currentYear) {
  const reasons = [];
  const issuerKey = issuer.toLowerCase();
  let score = 40;

  if (!issuer) {
    reasons.push('Missing issuer — cannot corroborate source');
    return { level: 'unknown', score: 25, reasons };
  }

  if (KNOWN_ISSUERS.has(issuerKey) || [...KNOWN_ISSUERS].some(k => issuerKey.includes(k))) {
    score += 35;
    reasons.push('Issuer matches common accredited providers list');
  } else {
    reasons.push('Issuer not on internal allowlist — manual verification recommended');
    score += 10;
  }

  if (credentialId && credentialId.length >= 6) {
    score += 15;
    reasons.push('Credential identifier present for cross-check');
  } else {
    reasons.push('No credential ID supplied');
  }

  if (issueYear != null && !Number.isNaN(issueYear)) {
    if (issueYear > currentYear) {
      reasons.push('Issue year in the future — data inconsistency');
      score -= 25;
    } else if (issueYear >= currentYear - 25) {
      reasons.push('Issue year within plausible range');
      score += 10;
    } else {
      reasons.push('Credential may be outdated; confirm renewal path');
    }
  }

  score = Math.max(0, Math.min(100, score));
  const level = score >= 72 ? 'verified' : score >= 48 ? 'review' : 'suspicious';
  return { level, score, reasons };
}

function scoreRelevance(name, issuer, jobBlob, skills) {
  const reasons = [];
  const blob = `${name} ${issuer} ${(skills || []).join(' ')}`.toLowerCase();
  if (!jobBlob.trim()) {
    reasons.push('No job context — relevance scored on credential density only');
    return { level: 'medium', score: 55, reasons };
  }

  const tokens = jobBlob.split(/\W+/).filter(t => t.length > 2);
  let hits = 0;
  for (const t of tokens) {
    if (blob.includes(t)) hits++;
  }
  const ratio = tokens.length ? hits / tokens.length : 0;
  let score = 40 + Math.round(ratio * 100);
  score = Math.max(0, Math.min(100, score));

  if (hits > 0) reasons.push(`Overlaps with ${hits} job keyword(s)`);
  else reasons.push('Low lexical overlap with role keywords — may still be transferable');

  const level = score >= 70 ? 'high' : score >= 45 ? 'medium' : 'low';
  return { level, score, reasons };
}

function scoreValidity(issueYear, expiresAt, now, currentYear) {
  const reasons = [];

  if (expiresAt && !Number.isNaN(expiresAt.getTime())) {
    if (expiresAt < now) {
      reasons.push('Expiry date is in the past');
      return { level: 'expired', score: 25, reasons };
    }
    reasons.push('Expiry date in the future');
    return { level: 'valid', score: 92, reasons };
  }

  if (issueYear != null && !Number.isNaN(issueYear)) {
    if (issueYear > currentYear) {
      reasons.push('Invalid issue year');
      return { level: 'indeterminate', score: 30, reasons };
    }
    reasons.push('Active status assumed without expiry — confirm with issuer');
    return { level: 'valid', score: 72, reasons };
  }

  reasons.push('No expiry or issue year — validity indeterminate');
  return { level: 'indeterminate', score: 50, reasons };
}

export const evaluateAnswers = async (answers, questions) => {
  const scores = {
    technical: 0,
    communication: 0,
    confidence: 0,
    overall: 0,
  };

  if (!answers?.length) return scores;

  let totalTechnical = 0;
  let totalCommunication = 0;
  let totalConfidence = 0;

  answers.forEach(answer => {
    const words = answer.answer ? answer.answer.split(' ').length : 0;
    totalTechnical += Math.min((words / 50) * 100, 100);
    totalCommunication += evaluateCommunication(answer.answer || '');
    totalConfidence += answer.confidence ?? 50;
  });

  const n = answers.length;
  scores.technical = Math.round(totalTechnical / n);
  scores.communication = Math.round(totalCommunication / n);
  scores.confidence = Math.round(totalConfidence / n);
  scores.overall = Math.round((scores.technical + scores.communication + scores.confidence) / 3);

  return scores;
};

const evaluateCommunication = answer => {
  if (!answer) return 20;
  let score = 50;
  const sentences = answer.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length > 2) score += 15;
  if (/example|instance|like|such as/i.test(answer)) score += 15;
  if (/however|therefore|additionally|furthermore|in conclusion/i.test(answer)) score += 10;
  if (/technical|implementation|architecture|design|algorithm/i.test(answer)) score += 10;
  return Math.min(score, 100);
};

export const generateFeedback = (scores, aiAnalysis) => {
  let feedback = '';
  if (scores.technical >= 75) feedback += 'Strong technical knowledge demonstrated. ';
  else if (scores.technical >= 50) feedback += 'Adequate technical understanding. ';
  else feedback += 'Consider strengthening technical skills. ';

  if (scores.communication >= 75) feedback += 'Excellent communication skills. ';
  else if (scores.communication >= 50) feedback += 'Good communication overall. ';
  else feedback += 'Focus on improving communication clarity. ';

  if (scores.overall >= 75) feedback += 'Overall, this is a strong candidate.';
  else if (scores.overall >= 50) feedback += 'Overall, a promising candidate with room for growth.';
  else feedback += 'Overall, additional preparation may be beneficial.';

  if (aiAnalysis?.softSkills) {
    const s = aiAnalysis.softSkills;
    feedback += ` AI-assisted soft-skill view: collaboration ${s.collaboration}/100, problem-solving ${s.problemSolving}/100, professionalism ${s.professionalism}/100.`;
  }

  return feedback;
};

/**
 * Full pipeline: legacy scores + AI narrative + optional certification validation.
 */
export const evaluateInterviewFull = async (answers, questions, options = {}) => {
  const { certifications = [], jobContext = {} } = options;
  const scores = await evaluateAnswers(answers, questions);
  const aiAnalysis = runAiAnalysis(answers, questions, jobContext);

  scores.communication = Math.round((scores.communication + aiAnalysis.communicationCues.score) / 2);
  scores.overall = Math.round((scores.technical + scores.communication + scores.confidence) / 3);

  const certificationValidation =
    certifications.length > 0 ? validateCertifications(certifications, jobContext) : null;

  const feedback = generateFeedback(scores, aiAnalysis);

  return { scores, aiAnalysis, certificationValidation, feedback };
};
