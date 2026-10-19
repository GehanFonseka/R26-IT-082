import { useEffect, useState } from "react";
import { defaultSimulation } from "../data/demoCandidate";
import { getAttritionAssessment } from "../services/attritionService";

export function useApplicantAttritionSimulation(baseline) {
  const { input } = baseline;
  const [simulation, setSimulation] = useState(defaultSimulation);
  const [state, setState] = useState(null);
  const changed = Object.keys(defaultSimulation).some((key) => simulation[key] !== defaultSimulation[key]);

  useEffect(() => { setSimulation(defaultSimulation); }, [input]);
  useEffect(() => {
    if (!input || !changed) return undefined;
    let active = true;
    setState({ input, simulation, result: null, loading: true, error: "" });
    const timer = window.setTimeout(() => {
      getAttritionAssessment(input.candidate, simulation, input.context)
        .then((result) => {
          if (active) setState({ input, simulation, result, loading: false, error: "" });
        })
        .catch(() => {
          if (active) setState({ input, simulation, result: null, loading: false, error: "Scenario analysis is unavailable. Try again or reset the scenario." });
        });
    }, 220);
    return () => { active = false; window.clearTimeout(timer); };
  }, [input, simulation, changed]);

  const current = state?.input === input && state?.simulation === simulation ? state : null;
  const scenarioActive = changed && input;
  return {
    candidate: input?.candidate || {},
    simulation,
    features: scenarioActive ? current?.result : baseline.result,
    baselineFeatures: baseline.result,
    loading: scenarioActive ? !current || current.loading : baseline.loading,
    error: scenarioActive ? current?.error || "" : baseline.error,
    onSimulationChange: setSimulation,
    onReset: () => setSimulation(defaultSimulation),
  };
}
