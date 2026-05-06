// Utility scoring functions

export function normalizeScore(score) {
    if (score > 100) return 100;
    if (score < 0) return 0;
    return score;
}

export function weightScore(score, weight) {
    return score * weight;
}