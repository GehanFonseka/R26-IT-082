import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { createAdminInterview, getAdminApplications, getAdminInterviews, getAdminJobs, updateAdminInterview } from "../services/apiClient";
const emptySchedule = { applicationId: "", scheduledAt: "", durationMinutes: "45", notes: "" };
export default function useInterviewScheduling(user) {
  const [searchParams] = useSearchParams();
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(searchParams.get("jobId") || "");
  const [form, setForm] = useState(() => ({ ...emptySchedule, applicationId: searchParams.get("applicationId") || "" }));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (user?.role !== "admin") return;
    let mounted = true;
    Promise.allSettled([getAdminJobs(), getAdminApplications(), getAdminInterviews()])
      .then(([jobsResult, applicationsResult, interviewsResult]) => {
        if (!mounted) return;
        if (jobsResult.status === "fulfilled") {
          setJobs(Array.isArray(jobsResult.value.data) ? jobsResult.value.data : []);
        }
        if (applicationsResult.status === "fulfilled") {
          setApplications(Array.isArray(applicationsResult.value.data) ? applicationsResult.value.data : []);
        }
        if (interviewsResult.status === "fulfilled") {
          setInterviews(Array.isArray(interviewsResult.value.data) ? interviewsResult.value.data : []);
        }
        const coreFailure = [jobsResult, applicationsResult].find((result) => result.status === "rejected");
        if (coreFailure) {
          setError(coreFailure.reason?.message || "Could not load job opportunities.");
        } else if (interviewsResult.status === "rejected") {
          setError("Interview records are temporarily unavailable. Restart the gateway and job service to enable saved schedules.");
        }
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [user?.role]);
  const jobRows = useMemo(() => {
    const byJob = applications.reduce((groups, application) => {
      const list = groups.get(application.jobId) || [];
      list.push(application);
      groups.set(application.jobId, list);
      return groups;
    }, new Map());
    return [...jobs].map((job) => {
      const jobApplications = (byJob.get(job.id) || []).filter((application) => application.status !== "rejected");
      const scheduled = interviews.filter((interview) => interview.jobId === job.id && interview.status === "scheduled");
      return { ...job, applications: jobApplications, scheduled };
    }).sort((first, second) => (second.applications.length - first.applications.length) || (second.status === "open" ? 1 : 0) - (first.status === "open" ? 1 : 0) || new Date(second.createdAt || 0) - new Date(first.createdAt || 0));
  }, [applications, interviews, jobs]);
  const selectedJob = jobRows.find((job) => job.id === selectedJobId) || null;
  const selectedApplication = selectedJob?.applications.find((application) => application.id === form.applicationId) || null;
  const scheduledInterviews = useMemo(() => interviews.filter((interview) => interview.status === "scheduled").sort((first, second) => new Date(first.scheduledAt) - new Date(second.scheduledAt)), [interviews]);
  const scheduledGroups = useMemo(() => {
    const groups = new Map();
    scheduledInterviews.forEach((interview) => {
      const key = interview.job?.id || interview.jobId || interview.job?.title || "unknown-job";
      const group = groups.get(key) || { key, title: interview.job?.title || "Unassigned job vacancy", company: interview.job?.company || "Hiring team", location: interview.job?.location || "", interviews: [] };
      group.interviews.push(interview);
      groups.set(key, group);
    });
    return [...groups.values()];
  }, [scheduledInterviews]);
  const openJob = (job) => {
    setSelectedJobId(job.id);
    setForm({ ...emptySchedule, applicationId: "" });
    setMessage("");
    setError("");
    window.requestAnimationFrame(() => document.getElementById("interview-schedule-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  const updateForm = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submitSchedule = async (event) => {
    event.preventDefault();
    if (!selectedJob || !form.applicationId || !form.scheduledAt) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await createAdminInterview({
        jobId: selectedJob.id,
        applicationId: form.applicationId,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        durationMinutes: Number(form.durationMinutes),
        notes: form.notes,
      });
      setInterviews((current) => [response.data, ...current]);
      setForm((current) => ({ ...current, scheduledAt: "", notes: "" }));
      setMessage("Interview scheduled and saved successfully.");
    } catch (requestError) {
      setError(requestError.message || "Could not schedule this interview.");
    } finally {
      setSaving(false);
    }
  };
  const cancelInterview = async (interviewId) => {
    setError("");
    try {
      const response = await updateAdminInterview(interviewId, { status: "cancelled" });
      setInterviews((current) => current.map((interview) => interview.id === interviewId ? response.data : interview));
    } catch (requestError) {
      setError(requestError.message || "Could not cancel this interview.");
    }
  };
  useEffect(() => {
    if (!loading && selectedJob) document.getElementById("interview-schedule-panel")?.scrollIntoView({ block: "start" });
  }, [loading, selectedJobId]);
  return { navigationOpen, setNavigationOpen, loading, saving, error, message, jobRows, selectedJobId, setSelectedJobId, form, setForm, selectedJob, selectedApplication, scheduledInterviews, scheduledGroups, interviews, openJob, updateForm, submitSchedule, cancelInterview };
}
