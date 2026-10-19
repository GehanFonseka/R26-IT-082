import { useEffect, useState } from "react";
import { getApplicantAttritionInput } from "../services/applicantAttritionService";
import { getAttritionAssessment } from "../services/attritionService";
import { defaultSimulation } from "../data/demoCandidate";

export function useApplicantAttrition(application, job) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ result: null, loading: true, error: "" });
  const [input, setInput] = useState(null);

  useEffect(() => {
    let active = true;
    setState({ result: null, loading: true, error: "" });
    setInput(null);
    getApplicantAttritionInput(application, job)
      .then((nextInput) => {
        if (!active) return null;
        setInput(nextInput);
        return getAttritionAssessment(nextInput.candidate, defaultSimulation, nextInput.context);
      })
      .then((result) => {
        if (active) setState({ result, loading: false, error: "" });
      })
      .catch(() => {
        if (active) setState({ result: null, loading: false, error: "Attrition results are unavailable. Please try again." });
      });
    return () => { active = false; };
  }, [application, job, attempt]);

  return { ...state, input, retry: () => setAttempt((value) => value + 1) };
}
