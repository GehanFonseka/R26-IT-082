import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CvHero from "../../components/matching/CvHero";
import JobDetailsPanel from "../../components/matching/JobDetailsPanel";
import ScoreMatchSection from "../../components/matching/ScoreMatchSection";
import CandidateCvPanel from "../../components/resume/CandidateCvPanel";
import CvNavigation from "../../components/layout/CvNavigation";
import CvTopbar from "../../components/layout/CvTopbar";
import CvAnalysisPage from "./CvAnalysisPage";
import { defaultSimulation } from "../../data/demoCandidate";
import { getAttritionAssessment } from "../../services/attritionService";
import { extractCv, getMyProfile } from "../../services/apiClient";
import { scoreMatch } from "../../services/matchingService";
import { toMatcherCandidate } from "../../utils/candidateProfile";
import { useAuth } from "../../context/AuthContext";
import "./CvMatcherPage.css";

const initialJob = {
  jobTitle: "Customer Support Specialist",
  jobSeniority: "Junior",
  jobIndustry: "FinTech",
  mustHaveSkills: "",
  niceToHaveSkills: "",
  jobDescription: "",
  responsibilities: "",
  requirements: "",
};

const initialCandidate = {
  candidateRole: "",
  candidateSeniority: "",
  yearsExperience: "",
  candidateIndustry: "",
  education: "",
  candidateSkills: "",
  summary: "",
  experienceBullets: "",
  candidateProjects: "",
};

function CvMatcherPage() {
  const { updateUser } = useAuth();
  const [navigationOpen, setNavigationOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const activeView = location.pathname.endsWith("/analysis") ? "analysis" : "matcher";
  const [retentionSimulation, setRetentionSimulation] = useState(defaultSimulation);
  const [job, setJob] = useState(initialJob);
  const [candidate, setCandidate] = useState(initialCandidate);
  const [selectedFile, setSelectedFile] = useState(null);
  const [rawCvText, setRawCvText] = useState("");
  const [preview, setPreview] = useState("");
  const [status, setStatus] = useState("Waiting for a CV upload.");
  const [statusType, setStatusType] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [result, setResult] = useState(null);
  const [retentionRisk, setRetentionRisk] = useState(null);
  const [baselineRetentionRisk, setBaselineRetentionRisk] = useState(null);
  const [retentionLoading, setRetentionLoading] = useState(false);
  const retentionRequestRef = useRef(0);
  useEffect(() => { getMyProfile().then((response) => { updateUser({ profilePhoto: response.data?.profilePhoto || "" }); setRawCvText(response.data?.cv?.rawText || ""); const saved = response.data?.cv?.candidate || {}; const compensation = response.data?.compensation || saved.compensation; if (Object.keys(saved).length || compensation) setCandidate((current) => ({ ...current, ...toMatcherCandidate({ ...saved, compensation }) })); }).catch(() => {}); }, []);
  const retentionCandidate = useMemo(() => ({ ...candidate, displayName: candidate.displayName || "this candidate", ...(result?.probability !== undefined ? { matchProbability: result.probability } : {}) }), [candidate, result]);
  const retentionContext = useMemo(() => ({ cvText: rawCvText, job }), [rawCvText, job]);
  useEffect(() => {
    let mounted = true;
    const requestNumber = retentionRequestRef.current + 1;
    retentionRequestRef.current = requestNumber;
    const timer = window.setTimeout(() => {
      if (!mounted) return;
      setRetentionLoading(true);
      getAttritionAssessment(retentionCandidate, retentionSimulation, retentionContext)
        .then((response) => mounted && requestNumber === retentionRequestRef.current && (setRetentionRisk(response), setRetentionLoading(false)))
        .catch(() => mounted && requestNumber === retentionRequestRef.current && setRetentionLoading(false));
    }, 220);
    return () => { mounted = false; window.clearTimeout(timer); };
  }, [retentionCandidate, retentionSimulation, retentionContext]);
  useEffect(() => { getAttritionAssessment(retentionCandidate, defaultSimulation, retentionContext).then(setBaselineRetentionRisk).catch(() => setBaselineRetentionRisk(null)); }, [retentionCandidate, retentionContext]);

  const updateStatus = (message, type = "") => {
    setStatus(message);
    setStatusType(type);
  };

  const handleFileSelected = (file) => {
    if (!file) return;
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx", "txt"].includes(extension)) {
      updateStatus("Supported CV formats are PDF, DOCX and TXT.", "error");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      updateStatus("Please choose a CV smaller than 15 MB.", "error");
      return;
    }
    setSelectedFile(file);
    setRawCvText("");
    updateStatus("File selected. Click Extract CV details to fill the form.");
  };

  const handleExtract = async () => {
    if (!selectedFile) return;
    setExtracting(true);
    updateStatus("Uploading your CV to the extraction service...");
    try {
      const response = await extractCv(selectedFile);
      const text = response.rawText || "";
      const extracted = response.candidate || {};
      const fields = toMatcherCandidate(extracted);
      setPreview(`${text.slice(0, 2500)}${text.length > 2500 ? "..." : ""}`);
      setRawCvText(text);
      setCandidate((current) => ({ ...current, ...fields }));
      const filled = Object.values(fields).filter(Boolean).length;
      updateStatus(`Extracted ${filled} of 8 candidate fields. Please review them before scoring.`, "success");
    } catch (error) {
      updateStatus(error.message || "Could not read this file.", "error");
    } finally {
      setExtracting(false);
    }
  };

  const handleScore = async () => {
    setScoring(true);
    setResult(null);
    try {
      const nextResult = await scoreMatch(job, candidate, (message) => updateStatus(message));
      setResult(nextResult);
      updateStatus("Match scored through the API Gateway and server-side model.", "success");
    } catch (error) {
      updateStatus(`Could not score this profile: ${error.message || error}`, "error");
    } finally {
      setScoring(false);
    }
  };

  return (
    <div className="cv-app-shell">
      <CvNavigation isOpen={navigationOpen} activeView={activeView} onNavigate={(view) => navigate(view === "analysis" ? "/matching/analysis" : view === "jobs" ? "/jobs" : view === "interviews" ? "/interviews" : view === "skill-analysis" ? "/skill-analysis" : "/matching")} onClose={() => setNavigationOpen(false)} />
      <div className="cv-app-shell__main">
        <CvTopbar activeView={activeView} onMenuToggle={() => setNavigationOpen(true)} />
        {activeView === "analysis" ? <CvAnalysisPage job={job} candidate={candidate} result={result} selectedFile={selectedFile} retentionCandidate={retentionCandidate} retentionSimulation={retentionSimulation} retentionRisk={retentionRisk} baselineRetentionRisk={baselineRetentionRisk} retentionLoading={retentionLoading} onRetentionSimulationChange={setRetentionSimulation} onResetRetentionSimulation={() => setRetentionSimulation(defaultSimulation)} onGoToMatcher={() => navigate("/matching")} /> : <main className="cv-matcher-page" id="cv-matcher">
          <CvHero />
          <section className="cv-matcher-page__workflow">
            <JobDetailsPanel job={job} onChange={setJob} />
            <CandidateCvPanel candidate={candidate} selectedFile={selectedFile} preview={preview} status={status} statusType={statusType} extracting={extracting} onFileSelected={handleFileSelected} onExtract={handleExtract} onCandidateChange={setCandidate} />
          </section>
          <ScoreMatchSection result={result} isScoring={scoring} onScore={handleScore} />
          <footer className="cv-matcher-page__footer"><span>Assistive ranking only - always review the original CV and job requirements.</span><span>Local ONNX model</span></footer>
        </main>}
      </div>
    </div>
  );
}

export default CvMatcherPage;
