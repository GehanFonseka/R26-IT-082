import { extractCandidateFeatures } from "./featureExtractor.js";
import { matchCandidate } from "./candidateMatcher.js";
import { generateExplanation } from "./explainabilityEngine.js";

// Simulated controller function

export function processCandidate(resumeText, job) {
    const candidate = extractCandidateFeatures(resumeText);

    const result = matchCandidate(candidate, job);

    const explanation = generateExplanation(result);

    return {
        candidate,
        result,
        explanation
    };
}