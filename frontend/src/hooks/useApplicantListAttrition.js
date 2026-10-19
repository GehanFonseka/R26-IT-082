import { useEffect, useState } from "react";
import { getApplicantAttritionInput } from "../services/applicantAttritionService";
import { getAttritionAssessment } from "../services/attritionService";
import { defaultSimulation } from "../data/demoCandidate";

export function useApplicantListAttrition(applications, job) {
  const [state, setState] = useState(null);
  useEffect(() => {
    if (!job || !applications.length) return undefined;
    let active = true;
    let cursor = 0;
    setState({ applications, job, results: {} });
    async function worker() {
      while (active && cursor < applications.length) {
        const application = applications[cursor++];
        let assessment;
        try {
          const input = await getApplicantAttritionInput(application, job);
          if (!active) return;
          const result = await getAttritionAssessment(input.candidate, defaultSimulation, input.context);
          assessment = { result, loading: false };
        } catch {
          assessment = { result: null, loading: false };
        }
        if (active) setState((current) => ({
          ...current, results: { ...current.results, [application.id]: assessment },
        }));
      }
    }
    Promise.all(Array.from({ length: Math.min(3, applications.length) }, worker));
    return () => { active = false; };
  }, [applications, job]);
  return state?.applications === applications && state?.job === job ? state.results : {};
}
