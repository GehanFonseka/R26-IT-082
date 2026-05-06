// Feature Extraction from Resume Text

export function extractSkills(text) {
    const skillsDatabase = ["JavaScript", "React", "Node.js", "MongoDB", "Python"];

    return skillsDatabase.filter(skill =>
        text.toLowerCase().includes(skill.toLowerCase())
    );
}

export function extractExperience(text) {
    const match = text.match(/(\d+)\s+years?/i);
    return match ? parseInt(match[1]) : 0;
}

export function extractCandidateFeatures(resumeText) {
    return {
        skills: extractSkills(resumeText),
        experience: extractExperience(resumeText)
    };
}