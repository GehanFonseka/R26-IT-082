// Explainable AI Engine
// Added explanation confidence level

export function generateExplanation(result) {
    const { skillScore, expScore, finalScore } = result;

    let explanation = `Final Match Score: ${finalScore}%\n`;

    explanation += `Skill Match: ${skillScore.toFixed(2)}%\n`;
    explanation += `Experience Match: ${expScore.toFixed(2)}%\n`;

    if (skillScore > 80) {
        explanation += "Strong skill alignment with job requirements.\n";
    } else {
        explanation += "Partial skill match.\n";
    }

    if (expScore === 100) {
        explanation += "Experience fully meets job requirements.\n";
    } else {
        explanation += "Experience is below required level.\n";
    }

    return explanation;
}