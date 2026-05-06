// Candidate Matching Engine

export function calculateSkillMatch(candidateSkills, jobSkills) {
    let matchCount = 0;

    jobSkills.forEach(skill => {
        if (candidateSkills.includes(skill)) {
            matchCount++;
        }
    });

    return (matchCount / jobSkills.length) * 100;
}

export function calculateExperienceMatch(candidateExp, requiredExp) {
    if (candidateExp >= requiredExp) return 100;
    return (candidateExp / requiredExp) * 100;
}

export function calculateFinalScore(skillScore, expScore) {
    const finalScore = (skillScore * 0.7) + (expScore * 0.3);
    return Math.round(finalScore);
}

export function matchCandidate(candidate, job) {
    const skillScore = calculateSkillMatch(candidate.skills, job.skills);
    const expScore = calculateExperienceMatch(candidate.experience, job.experience);

    const finalScore = calculateFinalScore(skillScore, expScore);

    return {
        skillScore,
        expScore,
        finalScore
    };
}