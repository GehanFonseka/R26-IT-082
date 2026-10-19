import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createAdminJob, getAdminApplications, getAdminInterviews, getAdminJobs, updateAdminApplication, updateAdminJob } from "../services/apiClient";
import { emptyJob, splitSkills } from "../pages/admin/adminDashboardUtils";
import { adminDashboardMetrics } from "../pages/admin/adminDashboardMetrics";

export default function useAdminDashboard(mode, user) {
  const navigate = useNavigate();
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [activeView, setActiveView] = useState(mode === "jobs" ? "admin-jobs" : mode === "applications" ? "admin-applications" : "admin");
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [draft, setForm] = useState(emptyJob);
  const form = { ...draft, company: user?.companyName || "" };
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [jobQuery, setJobQuery] = useState("");
  const [jobsTab, setJobsTab] = useState("create");
  const [applicationQuery, setApplicationQuery] = useState("");
  const [applicationStage, setApplicationStage] = useState("all");
  const [applicationJobFilter, setApplicationJobFilter] = useState("all");
  const [applicationSort, setApplicationSort] = useState("match");

  useEffect(() => {
    setActiveView(mode === "jobs" ? "admin-jobs" : mode === "applications" ? "admin-applications" : "admin");
  }, [mode]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([
      mode === "applications" ? Promise.resolve({ data: [] }) : getAdminJobs(),
      mode === "jobs" ? Promise.resolve({ data: [] }) : getAdminApplications(),
      mode === "overview" ? getAdminInterviews().catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
    ])
      .then(([jobResponse, applicationResponse, interviewResponse]) => {
        if (!mounted) return;
        setJobs(jobResponse.data || []);
        setApplications(applicationResponse.data || []);
        setInterviews(interviewResponse.data || []);
      })
      .catch((requestError) => mounted && setError(requestError.message || "Could not load the admin workspace."))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [mode]);

  const postingChecks = [
    { key: "title", label: "Job title", value: form.title },
    { key: "company", label: "Company", value: form.company },
    { key: "location", label: "Location", value: form.location },
    { key: "industry", label: "Industry", value: form.industry },
    { key: "mustHaveSkills", label: "Must-have skills", value: form.mustHaveSkills },
    { key: "description", label: "Job description", value: form.description },
    { key: "responsibilities", label: "Responsibilities", value: form.responsibilities },
    { key: "requirements", label: "Requirements", value: form.requirements },
  ];
  const completedPostingChecks = postingChecks.filter((item) => String(item.value || "").trim()).length;
  const postProgress = Math.round((completedPostingChecks / postingChecks.length) * 100);
  const coreDetailsReady = form.title.trim().length >= 2 && form.company.trim().length >= 2;

  const navigateFromSidebar = (view) => {
    if (view === "matcher") {
      navigate("/matching");
      return;
    }
    const destination = view === "admin-applications" ? "/admin/applications" : view === "admin-jobs" ? "/admin/jobs" : view === "admin-attrition" ? "/admin/attrition" : view === "admin-interviews" ? "/admin/interviews" : view === "admin-interview-results" ? "/admin/interview-results" : "/admin";
    navigate(destination);
  };

  const updateForm = (event) => {
    if (event.target.name === "company") return;
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const publishJob = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setStatus("Publishing job post...");
    try {
      const response = await createAdminJob({
        ...form,
        mustHaveSkills: splitSkills(form.mustHaveSkills),
        niceToHaveSkills: splitSkills(form.niceToHaveSkills),
      });
      setJobs((current) => [response.data, ...current]);
      setForm(emptyJob);
      setStatus("Job post published and visible to candidates.");
    } catch (requestError) {
      setError(requestError.message || "Could not publish this job post.");
      setStatus("");
    } finally {
      setBusy(false);
    }
  };

  const clearJobForm = () => {
    const hasDraft = Object.entries(form).some(([key, value]) => key !== "employmentType" && key !== "company" && String(value || "").trim());
    if (hasDraft && !window.confirm("Clear this unfinished job post? Your entered details will be removed.")) return;
    setForm(emptyJob);
    setError("");
    setStatus("");
  };

  const changeApplicationStatus = async (applicationId, nextStatus) => {
    setError("");
    try {
      const response = await updateAdminApplication(applicationId, nextStatus);
      setApplications((current) => current.map((application) => application.id === applicationId ? response.data : application));
    } catch (requestError) {
      setError(requestError.message || "Could not update the application.");
    }
  };

  const changeJobStatus = async (job) => {
    setError("");
    try {
      const response = await updateAdminJob(job.id, { ...job, status: job.status === "open" ? "closed" : "open" });
      setJobs((current) => current.map((item) => item.id === job.id ? response.data : item));
    } catch (requestError) {
      setError(requestError.message || "Could not update the job post.");
    }
  };

  const goToAdminSection = (view) => navigate(view === "admin-jobs" ? "/admin/jobs" : "/admin/applications");

  const metrics = adminDashboardMetrics({ jobs, applications, interviews, jobQuery, applicationQuery, applicationStage, applicationJobFilter, applicationSort });
  return { navigationOpen, setNavigationOpen, activeView, jobs, applications, interviews, form, loading, busy, status, error, jobQuery, setJobQuery, jobsTab, setJobsTab, applicationQuery, setApplicationQuery, applicationStage, setApplicationStage, applicationJobFilter, setApplicationJobFilter, applicationSort, setApplicationSort, postingChecks, completedPostingChecks, postProgress, coreDetailsReady, navigateFromSidebar, updateForm, publishJob, clearJobForm, changeApplicationStatus, changeJobStatus, goToAdminSection, navigate, ...metrics };
}
