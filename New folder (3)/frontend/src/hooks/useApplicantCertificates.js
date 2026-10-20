import { useEffect, useState } from "react";
import { getApplicantCertificates } from "../services/applicantCertificateService";

export default function useApplicantCertificates(applicationId) {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState({ applicationId: "", loading: true, data: null, error: "" });
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    setState({ applicationId, loading: true, data: null, error: "" });
    getApplicantCertificates(applicationId, controller.signal)
      .then((response) => {
        if (!cancelled) setState({ applicationId, loading: false, data: response.data || {}, error: "" });
      })
      .catch((error) => {
        if (!cancelled) setState({ applicationId, loading: false, data: null, error: error.message || "Could not load the candidate’s certificates." });
      });
    return () => { cancelled = true; controller.abort(); };
  }, [applicationId, version]);

  const reload = () => {
    setState({ applicationId, loading: true, data: null, error: "" });
    setVersion((current) => current + 1);
  };
  return { ...(state.applicationId === applicationId ? state : { loading: true, data: null, error: "" }), reload };
}
