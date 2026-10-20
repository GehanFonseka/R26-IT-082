import { useEffect, useRef, useState } from "react";
import { getSavedCertificateChecks, verifyCertificateName } from "../../services/certificateService";

export default function useCertificateChecks(urls, cvText, active, cvRevision, savedChecks = {}, ownerId = "", applicationId = "") {
  const urlsKey = JSON.stringify([...new Set(urls)]);
  const key = JSON.stringify([ownerId, applicationId, cvRevision, urlsKey, cvText]);
  const [state, setState] = useState({ key: "", results: {} });
  const [retryVersion, setRetryVersion] = useState(0);
  const retries = useRef(new Set());
  const previousKey = useRef(key);
  if (previousKey.current !== key) { retries.current.clear(); previousKey.current = key; }

  useEffect(() => {
    if (!active || !cvText.trim() || !cvRevision || !JSON.parse(urlsKey).length) return undefined;
    const controller = new AbortController();
    let cancelled = false;
    let timer;
    const links = JSON.parse(urlsKey);
    const update = (url, result) => {
      if (cancelled) return;
      setState((previous) => ({ key, results: { ...(previous.key === key ? previous.results : {}), [url]: result } }));
    };
    const work = async () => {
      try {
        const response = await getSavedCertificateChecks(cvRevision, controller.signal, applicationId);
        if (cancelled) return;
        const results = response.data?.results || {};
        let checking = false;
        for (const url of links) {
          const force = retries.current.delete(url);
          let result = results[url];
          if (!result || force) {
            update(url, { status: "checking" });
            result = (await verifyCertificateName(url, cvRevision, controller.signal, force, applicationId)).data;
          }
          update(url, result || { status: "unavailable", reason: "The name check did not return a result." });
          checking ||= result?.status === "checking";
          if (cancelled) return;
        }
        if (checking && !cancelled) timer = setTimeout(work, 3000);
      } catch (error) {
        if (!cancelled) links.forEach((url) => update(url, { status: "unavailable", reason: error.message || "Saved certificate results could not be loaded." }));
      }
    };
    void work();
    return () => { cancelled = true; clearTimeout(timer); controller.abort(); };
  }, [active, urlsKey, cvText, cvRevision, ownerId, applicationId, retryVersion]);

  const retry = (url) => {
    retries.current.add(url);
    setState((previous) => {
      const results = { ...(previous.key === key ? previous.results : {}) };
      delete results[url];
      return { key, results };
    });
    setRetryVersion((value) => value + 1);
  };
  return { checks: state.key === key ? state.results : savedChecks, retry };
}
