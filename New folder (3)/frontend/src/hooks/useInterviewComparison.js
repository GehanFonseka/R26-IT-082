import { useEffect, useState } from "react";
import { analyzeInterview } from "../services/apiClient";
import { buildInterviewReferences } from "../utils/interviewReferences";

export default function useInterviewComparison(interviewId, analysis, setAnalysis) {
  const [references, setReferences] = useState({});
  const [comparing, setComparing] = useState(false);
  const [comparisonError, setComparisonError] = useState("");
  useEffect(() => { setReferences({}); setComparisonError(""); }, [interviewId]);

  const compare = async () => {
    setComparing(true); setComparisonError("");
    try {
      const referenceAnswers = buildInterviewReferences(analysis?.questionAnswers || [], references);
      if (referenceAnswers.length > 30) throw new Error("A comparison supports up to 30 reference answers.");
      const response = await analyzeInterview(interviewId, referenceAnswers);
      setAnalysis(response.data); setReferences({});
    } catch (error) {
      setComparisonError(error.message || "Could not analyze this interview.");
    } finally { setComparing(false); }
  };

  const updateReference = (questionId, value) => setReferences((current) => ({ ...current, [questionId]: value }));
  return { references, comparing, comparisonError, compare, updateReference };
}
