import { motion } from 'framer-motion'
import { BriefcaseBusiness, FileText, LoaderCircle, Lock, SearchCheck, Sparkles, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import Header from '../components/Header'
import { useUserMode } from '../context/UserModeContext'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const DEMO_CANDIDATE = {
  email: 'candidate@talentai.local',
  password: 'Candidate123!',
}
const DEMO_HR = {
  email: 'hr@talentai.local',
  password: 'Recruiter123!',
}
const CANDIDATE_TOKEN_KEY = 'talent_demo_candidate_token'
const HR_TOKEN_KEY = 'talent_demo_hr_token'

const fieldBaseClass =
  'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200/70 dark:border-white/10 dark:bg-slate-900 dark:text-white dark:focus:border-cyan-300 dark:focus:ring-cyan-400/25'

async function request(path, { method = 'GET', body, useFormData = false, authToken = '' } = {}) {
  const options = { method, headers: {} }
  if (authToken) {
    options.headers.Authorization = `Bearer ${authToken}`
  }

  if (body !== undefined && body !== null) {
    if (useFormData) {
      options.body = body
    } else {
      options.headers['Content-Type'] = 'application/json'
      options.body = JSON.stringify(body)
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, options)
  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      payload?.detail?.error ||
      payload?.error ||
      payload?.detail ||
      `Request failed with status ${response.status}`
    const error = new Error(message)
    error.status = response.status
    throw error
  }

  return payload
}

async function loginAsCandidate() {
  const payload = await request('/api/v1/auth/login', {
    method: 'POST',
    body: DEMO_CANDIDATE,
  })
  const token = payload?.token || ''
  if (!token) {
    throw new Error('Unable to create candidate demo session.')
  }
  window.localStorage.setItem(CANDIDATE_TOKEN_KEY, token)
  return token
}

async function getCandidateToken(forceRefresh = false) {
  if (!forceRefresh) {
    const existing = window.localStorage.getItem(CANDIDATE_TOKEN_KEY) || ''
    if (existing) {
      return existing
    }
  }
  return loginAsCandidate()
}

async function loginAsHr() {
  const payload = await request('/api/v1/auth/login', {
    method: 'POST',
    body: DEMO_HR,
  })
  const token = payload?.token || ''
  if (!token) {
    throw new Error('Unable to create HR demo session.')
  }
  window.localStorage.setItem(HR_TOKEN_KEY, token)
  return token
}

async function getHrToken(forceRefresh = false) {
  if (!forceRefresh) {
    const existing = window.localStorage.getItem(HR_TOKEN_KEY) || ''
    if (existing) {
      return existing
    }
  }
  return loginAsHr()
}

function scoreClass(value) {
  const score = Number(value || 0)
  if (score >= 75) {
    return 'text-emerald-700 dark:text-emerald-200'
  }
  if (score >= 50) {
    return 'text-amber-700 dark:text-amber-200'
  }
  return 'text-rose-700 dark:text-rose-200'
}

export default function LandingPage() {
  const { isCandidate, isHr } = useUserMode()

  const [jobs, setJobs] = useState([])
  const [selectedJobId, setSelectedJobId] = useState('')
  const [hrApplications, setHrApplications] = useState([])
  const [selectedHrApplicationId, setSelectedHrApplicationId] = useState('')
  const [cvFile, setCvFile] = useState(null)
  const [candidateMeta, setCandidateMeta] = useState(
    '{"role_title":"Software Engineer","department":"Engineering","experience_years":2}',
  )
  const [selectedModels, setSelectedModels] = useState({
    resume: true,
    matching: true,
    risk: true,
  })

  const [loadingJobs, setLoadingJobs] = useState(false)
  const [evaluating, setEvaluating] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [result, setResult] = useState(null)
  const [hrStatusSelection, setHrStatusSelection] = useState('Shortlisted')
  const [hrStatusBusy, setHrStatusBusy] = useState(false)
  const [hrRecheckBusy, setHrRecheckBusy] = useState(false)
  const [hrRecheckResult, setHrRecheckResult] = useState(null)
  const [hrInterviewAnswer, setHrInterviewAnswer] = useState('')
  const [hrInterviewQuestion, setHrInterviewQuestion] = useState('')

  const selectedJob = useMemo(
    () => jobs.find((item) => item.job_id === selectedJobId) || null,
    [jobs, selectedJobId],
  )
  const selectedHrApplication = useMemo(
    () => hrApplications.find((item) => item.application_id === selectedHrApplicationId) || null,
    [hrApplications, selectedHrApplicationId],
  )

  useEffect(() => {
    const currentStatus = String(selectedHrApplication?.status || '')
    if (['Shortlisted', 'Interviewed', 'Selected', 'Rejected'].includes(currentStatus)) {
      setHrStatusSelection(currentStatus)
      return
    }
    setHrStatusSelection('Shortlisted')
  }, [selectedHrApplication?.application_id, selectedHrApplication?.status])

  async function loadJobs() {
    setLoadingJobs(true)
    setErrorMessage('')
    try {
      const payload = await request('/api/v1/public/jobs')
      setJobs(Array.isArray(payload?.jobs) ? payload.jobs : [])
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setLoadingJobs(false)
    }
  }

  async function loadHrApplications() {
    setLoadingJobs(true)
    setErrorMessage('')
    try {
      let token = await getHrToken()
      let payload
      try {
        payload = await request('/api/v1/recruiter/applications', { authToken: token })
      } catch (error) {
        if (error?.status !== 401) {
          throw error
        }
        token = await getHrToken(true)
        payload = await request('/api/v1/recruiter/applications', { authToken: token })
      }

      const applications = Array.isArray(payload) ? payload : []
      setHrApplications(applications)
      setSelectedHrApplicationId((prev) => {
        if (prev && applications.some((item) => item.application_id === prev)) {
          return prev
        }
        return applications[0]?.application_id || ''
      })
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setLoadingJobs(false)
    }
  }

  async function runHrManualRecheck(requestedModels) {
    if (!selectedHrApplicationId) {
      setErrorMessage('Select a candidate first.')
      return
    }

    setHrRecheckBusy(true)
    setErrorMessage('')
    try {
      let token = await getHrToken()
      const body = {
        requested_models: requestedModels,
        persist_results: true,
      }

      if (requestedModels.includes('interview')) {
        if (hrInterviewAnswer.trim()) {
          body.interview_answer = hrInterviewAnswer.trim()
        }
        if (hrInterviewQuestion.trim()) {
          body.interview_question = hrInterviewQuestion.trim()
        }
      }

      let payload
      try {
        payload = await request(`/api/v1/recruiter/applications/${selectedHrApplicationId}/recheck`, {
          method: 'POST',
          body,
          authToken: token,
        })
      } catch (error) {
        if (error?.status !== 401) {
          throw error
        }
        token = await getHrToken(true)
        payload = await request(`/api/v1/recruiter/applications/${selectedHrApplicationId}/recheck`, {
          method: 'POST',
          body,
          authToken: token,
        })
      }

      setHrRecheckResult(payload || null)
      const updatedApplication = payload?.updated_application
      if (updatedApplication?.application_id) {
        setHrApplications((prev) =>
          prev.map((item) =>
            item.application_id === updatedApplication.application_id ? updatedApplication : item,
          ),
        )
      }
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setHrRecheckBusy(false)
    }
  }

  async function updateHrCandidateStatus() {
    if (!selectedHrApplicationId) {
      setErrorMessage('Select a candidate first.')
      return
    }

    setHrStatusBusy(true)
    setErrorMessage('')
    try {
      let token = await getHrToken()
      const body = {
        status: hrStatusSelection,
        note: `Manual HR status update: ${hrStatusSelection}`,
      }

      let payload
      try {
        payload = await request(`/api/v1/applications/${selectedHrApplicationId}/status`, {
          method: 'PATCH',
          body,
          authToken: token,
        })
      } catch (error) {
        if (error?.status !== 401) {
          throw error
        }
        token = await getHrToken(true)
        payload = await request(`/api/v1/applications/${selectedHrApplicationId}/status`, {
          method: 'PATCH',
          body,
          authToken: token,
        })
      }

      if (payload?.application_id) {
        setHrApplications((prev) =>
          prev.map((item) => (item.application_id === payload.application_id ? payload : item)),
        )
      }
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setHrStatusBusy(false)
    }
  }

  useEffect(() => {
    if (isHr) {
      setJobs([])
      setSelectedJobId('')
      setResult(null)
      setHrRecheckResult(null)
      setHrInterviewAnswer('')
      setHrInterviewQuestion('')
      loadHrApplications()
      return
    }

    setHrApplications([])
    setSelectedHrApplicationId('')
    setHrRecheckResult(null)
    loadJobs()
  }, [isHr])

  function toggleModel(key) {
    setSelectedModels((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  async function handleEvaluate(event) {
    event.preventDefault()

    if (!isCandidate) {
      setErrorMessage('Switch to Candidate mode to evaluate your profile.')
      return
    }

    if (!selectedJobId) {
      setErrorMessage('Select a job card first.')
      return
    }

    if (!(cvFile instanceof File)) {
      setErrorMessage('Upload your CV file first.')
      return
    }

    const enabledModels = Object.entries(selectedModels)
      .filter(([, enabled]) => enabled)
      .map(([name]) => name)
    if (enabledModels.length === 0) {
      setErrorMessage('Select at least one model: resume, matching, or risk.')
      return
    }

    setEvaluating(true)
    setErrorMessage('')
    setResult(null)

    try {
      let token = await getCandidateToken()
      const buildFormData = () => {
        const formData = new FormData()
        formData.append('cv_file', cvFile)
        formData.append('requested_models', enabledModels.join(','))
        if (candidateMeta.trim()) {
          formData.append('candidate_meta', candidateMeta)
        }
        return formData
      }

      let payload
      try {
        payload = await request(`/api/v1/public/jobs/${selectedJobId}/evaluate-cv`, {
          method: 'POST',
          body: buildFormData(),
          useFormData: true,
          authToken: token,
        })
      } catch (error) {
        if (error?.status !== 401) {
          throw error
        }
        token = await getCandidateToken(true)
        payload = await request(`/api/v1/public/jobs/${selectedJobId}/evaluate-cv`, {
          method: 'POST',
          body: buildFormData(),
          useFormData: true,
          authToken: token,
        })
      }

      setResult(payload)
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setEvaluating(false)
    }
  }

  return (
    <main className="min-h-screen">
      <Header
        brandText="AI Talent Acquisition"
        tagline={isHr ? 'HR mode: applied candidate dashboard and evaluated reports' : 'Candidate mode: apply and run selected models'}
        navLinks={[]}
      />

      <section className="mx-auto max-w-6xl px-4 py-8">
        {isHr ? (
          <>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="surface-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="accent-chip">
                    <UserRound className="h-3.5 w-3.5" />
                    HR Candidate Dashboard
                  </p>
                  <h1 className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">Applied Candidates</h1>
                  <p className="mt-2 text-sm text-slate-600 dark:text-white/70">
                    Click a candidate to view that candidate&apos;s evaluated report.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button type="button" onClick={loadHrApplications} className="btn-secondary">
                    Refresh List
                  </button>
                  <Link to="/hr-post-jobs" className="btn-primary">
                    Go To HR Job Posting
                    <Sparkles className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              {errorMessage ? (
                <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-300/25 dark:bg-rose-400/10 dark:text-rose-200">
                  {errorMessage}
                </p>
              ) : null}
            </motion.div>

            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="surface-card mt-4 p-5">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900">
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Candidate List</h2>
                  <div className="mt-3 max-h-[560px] space-y-2 overflow-auto">
                    {loadingJobs ? (
                      <p className="inline-flex items-center gap-2 text-sm text-cyan-700 dark:text-cyan-200">
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Loading applied candidates...
                      </p>
                    ) : null}

                    {!loadingJobs && hrApplications.length === 0 ? (
                      <p className="text-sm text-slate-500 dark:text-white/60">No applied candidates found.</p>
                    ) : null}

                    {hrApplications.map((application) => {
                      const isSelected = selectedHrApplicationId === application.application_id
                      const isRejected = String(application.status || '').toLowerCase() === 'rejected'

                      return (
                        <button
                          key={application.application_id}
                          type="button"
                          onClick={() => {
                            setSelectedHrApplicationId(application.application_id)
                            setHrRecheckResult(null)
                          }}
                          className={`block w-full rounded-xl border p-3 text-left transition ${
                            isRejected
                              ? 'border-rose-400 bg-rose-100 dark:border-rose-300/45 dark:bg-rose-500/20'
                              : isSelected
                                ? 'border-cyan-300 bg-cyan-50 dark:border-cyan-300/35 dark:bg-cyan-400/10'
                                : 'border-slate-200 bg-white hover:border-slate-400 dark:border-white/10 dark:bg-slate-900 dark:hover:border-white/35'
                          }`}
                        >
                          <p className={`text-sm font-semibold ${isRejected ? 'text-rose-900 dark:text-rose-100' : 'text-slate-900 dark:text-white'}`}>
                            {application.candidate_name || application.candidate_email}
                          </p>
                          <p className={`mt-1 text-xs ${isRejected ? 'text-rose-800 dark:text-rose-100' : 'text-slate-600 dark:text-white/70'}`}>
                            {application.application_id} | Vacancy: {application.vacancy_id}
                          </p>
                          <p className={`mt-1 text-xs ${isRejected ? 'text-rose-800 dark:text-rose-100' : 'text-slate-600 dark:text-white/70'}`}>
                            Status: {application.status} | Fit: <span className={scoreClass(application?.ai_scores?.fit_score_0_100)}>{Number(application?.ai_scores?.fit_score_0_100 || 0).toFixed(1)}</span>
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900">
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Evaluated Report</h2>
                  {!selectedHrApplication ? (
                    <p className="mt-3 text-sm text-slate-500 dark:text-white/60">
                      Select a candidate from the list to view their report.
                    </p>
                  ) : (
                    <div className="mt-3 space-y-3 text-xs">
                      <div className={`rounded-lg border p-3 dark:bg-slate-950/70 ${
                        String(selectedHrApplication.status || '').toLowerCase() === 'rejected'
                          ? 'border-rose-300 bg-rose-100 dark:border-rose-300/45 dark:bg-rose-500/20'
                          : 'border-slate-200 bg-white dark:border-white/10'
                      }`}>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {selectedHrApplication.candidate_name || selectedHrApplication.candidate_email}
                        </p>
                        <p className="mt-1 text-slate-600 dark:text-white/70">
                          Application: {selectedHrApplication.application_id} | Status: {selectedHrApplication.status}
                        </p>
                        <p className="mt-1 text-slate-600 dark:text-white/70">Vacancy: {selectedHrApplication.vacancy_id}</p>
                      </div>

                      <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950/70">
                        <p className="font-semibold text-slate-800 dark:text-white/90">Manual Candidate Status</p>
                        <div className="mt-2 flex flex-wrap items-end gap-2">
                          <label className="text-xs font-medium text-slate-700 dark:text-white/85">
                            Status
                            <select
                              value={hrStatusSelection}
                              onChange={(event) => setHrStatusSelection(event.target.value)}
                              className={fieldBaseClass}
                            >
                              <option value="Shortlisted">Shortlisted</option>
                              <option value="Interviewed">Interviewed</option>
                              <option value="Selected">Selected</option>
                              <option value="Rejected">Rejected</option>
                            </select>
                          </label>
                          <button
                            type="button"
                            onClick={updateHrCandidateStatus}
                            disabled={hrStatusBusy}
                            className="btn-secondary"
                          >
                            {hrStatusBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                            Update Status
                          </button>
                        </div>
                      </div>

                      <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950/70">
                        <p className="font-semibold text-slate-800 dark:text-white/90">Manual Recheck Models</p>
                        <p className="mt-1 text-slate-600 dark:text-white/70">
                          Re-run any model individually to recheck this candidate.
                        </p>

                        <label className="mt-2 block text-xs font-medium text-slate-700 dark:text-white/85">
                          Interview Question (for Model 3, optional)
                          <input
                            type="text"
                            value={hrInterviewQuestion}
                            onChange={(event) => setHrInterviewQuestion(event.target.value)}
                            className={fieldBaseClass}
                            placeholder="Describe a challenging production issue you solved."
                          />
                        </label>
                        <label className="mt-2 block text-xs font-medium text-slate-700 dark:text-white/85">
                          Interview Answer (for Model 3, required if none stored)
                          <textarea
                            rows={3}
                            value={hrInterviewAnswer}
                            onChange={(event) => setHrInterviewAnswer(event.target.value)}
                            className={fieldBaseClass}
                            placeholder="Paste candidate interview answer here..."
                          />
                        </label>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => runHrManualRecheck(['interview'])}
                            className="rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(251,146,60,0.28)]"
                            disabled={hrRecheckBusy}
                          >
                            {hrRecheckBusy ? <LoaderCircle className="h-4 w-4 animate-spin inline-block mr-1" /> : null}
                            Run Model 3 Interview Recheck
                          </button>
                          <button type="button" onClick={() => runHrManualRecheck(['resume'])} className="btn-secondary" disabled={hrRecheckBusy}>
                            Model 1 Resume
                          </button>
                          <button type="button" onClick={() => runHrManualRecheck(['matching'])} className="btn-secondary" disabled={hrRecheckBusy}>
                            Model 2 Matching
                          </button>
                          <button type="button" onClick={() => runHrManualRecheck(['risk'])} className="btn-secondary" disabled={hrRecheckBusy}>
                            Model 4 Risk
                          </button>
                          <button type="button" onClick={() => runHrManualRecheck(['resume', 'matching', 'interview', 'risk'])} className="btn-primary" disabled={hrRecheckBusy}>
                            {hrRecheckBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                            Run All 4
                          </button>
                        </div>
                      </div>

                      <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950/70">
                        <p className="font-semibold text-slate-800 dark:text-white/90">AI Evaluation</p>
                        <p className="mt-1 text-slate-700 dark:text-white/80">
                          Fit: <span className={scoreClass(selectedHrApplication?.ai_scores?.fit_score_0_100)}>{Number(selectedHrApplication?.ai_scores?.fit_score_0_100 || 0).toFixed(1)}</span>
                        </p>
                        <p className="text-slate-700 dark:text-white/80">
                          Matching: {Number(selectedHrApplication?.ai_scores?.matching?.score_0_100 || 0).toFixed(1)}
                        </p>
                        <p className="text-slate-700 dark:text-white/80">
                          Risk Band: {selectedHrApplication?.ai_scores?.risk?.risk_band || 'N/A'}
                        </p>
                        <p className="text-slate-700 dark:text-white/80">
                          Attrition Risk Score: {Number(selectedHrApplication?.ai_scores?.risk?.attrition_risk_score_0_100 || 0).toFixed(1)}
                        </p>
                        <p className="text-slate-700 dark:text-white/80">
                          Interview Score: {Number(selectedHrApplication?.ai_scores?.interview?.overall_score_0_100 || 0).toFixed(1)}
                        </p>
                        <p className="mt-1 text-slate-700 dark:text-white/80">
                          Recommendation: {selectedHrApplication?.ai_scores?.ai_recommendation || 'Pending'}
                        </p>
                        <p className="text-slate-500 dark:text-white/60">
                          {selectedHrApplication?.ai_scores?.ai_recommendation_reason || 'No recommendation explanation available.'}
                        </p>
                      </div>

                      {(hrRecheckResult?.model_3_interview_evaluation || selectedHrApplication?.ai_scores?.interview) ? (
                        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 dark:border-amber-300/35 dark:bg-amber-400/10">
                          <p className="font-semibold text-amber-900 dark:text-amber-100">
                            Model 3 Interview Evaluation Result
                          </p>
                          <p className="mt-1 text-amber-900 dark:text-amber-100">
                            Source: {hrRecheckResult?.model_3_interview_evaluation ? 'Latest manual run' : 'Stored application score'}
                          </p>
                          <p className="mt-1 text-amber-900 dark:text-amber-100">
                            Overall Score: {Number((hrRecheckResult?.model_3_interview_evaluation || selectedHrApplication?.ai_scores?.interview)?.overall_score_0_100 || 0).toFixed(1)}
                            {' '}| Band: {(hrRecheckResult?.model_3_interview_evaluation || selectedHrApplication?.ai_scores?.interview)?.band || 'N/A'}
                          </p>
                          <p className="mt-1 text-amber-900 dark:text-amber-100">
                            Summary: {(hrRecheckResult?.model_3_interview_evaluation || selectedHrApplication?.ai_scores?.interview)?.summary || 'N/A'}
                          </p>
                          <p className="mt-1 text-amber-900 dark:text-amber-100">
                            Confidence: {Number((hrRecheckResult?.model_3_interview_evaluation || selectedHrApplication?.ai_scores?.interview)?.confidence || 0).toFixed(1)}%
                          </p>
                        </div>
                      ) : null}

                      {hrRecheckResult ? (
                        <details className="rounded-lg border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950/70">
                          <summary className="cursor-pointer text-xs font-semibold text-slate-800 dark:text-white/90">
                            Latest Manual Recheck Output
                          </summary>
                          <pre className="mt-2 max-h-56 overflow-auto text-[11px] text-slate-700 dark:text-white/80">
                            {JSON.stringify(hrRecheckResult, null, 2)}
                          </pre>
                        </details>
                      ) : null}

                      <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950/70">
                        <p className="font-semibold text-slate-800 dark:text-white/90">Resume Snapshot</p>
                        <p className="mt-1 text-slate-700 dark:text-white/80">
                          File: {selectedHrApplication?.resume?.file_name || 'N/A'}
                        </p>
                        <p className="mt-1 text-slate-700 dark:text-white/80">
                          Skills: {(selectedHrApplication?.resume?.skills || []).join(', ') || 'N/A'}
                        </p>
                      </div>

                      <details className="rounded-lg border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950/70">
                        <summary className="cursor-pointer text-xs font-semibold text-slate-800 dark:text-white/90">
                          <span className="inline-flex items-center gap-2">
                            <FileText className="h-3.5 w-3.5" />
                            Full Evaluated Report JSON
                          </span>
                        </summary>
                        <pre className="mt-2 max-h-56 overflow-auto text-[11px] text-slate-700 dark:text-white/80">
                          {JSON.stringify(selectedHrApplication, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              </div>
            </motion.section>
          </>
        ) : null}

        {!isHr ? (
          <>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="surface-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="accent-chip">
                <BriefcaseBusiness className="h-3.5 w-3.5" />
                Candidate Job Board
              </p>
              <h1 className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">Choose a Job, Then Run Models</h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-white/70">
                Main action: click a job card to open candidate evaluation tools (Resume Parsing, Matching, Risk).
              </p>
            </div>

            {isHr ? (
              <Link
                to="/hr-post-jobs"
                className="btn-primary"
              >
                Go To HR Job Posting
                <Sparkles className="h-4 w-4" />
              </Link>
            ) : null}
          </div>

          {errorMessage ? (
            <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-300/25 dark:bg-rose-400/10 dark:text-rose-200">
              {errorMessage}
            </p>
          ) : null}
        </motion.div>

        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="surface-card mt-4 p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Open Job Listings</h2>
            <button
              type="button"
              onClick={loadJobs}
              className="btn-secondary"
            >
              Refresh
            </button>
          </div>

          {!loadingJobs && jobs.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500 dark:text-white/60">No jobs posted yet.</p>
          ) : null}

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {loadingJobs
              ? Array.from({ length: 6 }).map((_, idx) => (
                  <div key={`skeleton-${idx}`} className="shimmer-skeleton h-[118px]" />
                ))
              : null}
            {jobs.map((job) => (
              <button
                key={job.job_id}
                type="button"
                onClick={() => {
                  setSelectedJobId(job.job_id)
                  setResult(null)
                }}
                className={`rounded-xl border p-4 text-left transition ${
                  selectedJobId === job.job_id
                    ? 'border-slate-900 bg-slate-50 dark:border-cyan-300/35 dark:bg-cyan-400/10'
                    : 'border-slate-200 bg-white hover:border-slate-400 dark:border-white/10 dark:bg-slate-900 dark:hover:border-white/35'
                }`}
              >
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{job.job_name}</p>
                <p className="mt-1 text-xs text-slate-600 dark:text-white/70">
                  Skills: {(job.required_skills || []).join(', ') || 'N/A'}
                </p>
                <p className="mt-2 text-[11px] font-semibold text-slate-700 dark:text-cyan-200">
                  {selectedJobId === job.job_id ? 'Selected' : 'Click to evaluate'}
                </p>
              </button>
            ))}
          </div>
        </motion.section>

        <motion.section
          id="candidate-evaluation-panel"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="surface-card mt-4 p-5"
        >
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Candidate Evaluation Tools</h2>
          <p className="mt-1 text-xs text-slate-600 dark:text-white/70">
            Selected Job: {selectedJob ? `${selectedJob.job_id} - ${selectedJob.job_name}` : 'None'}
          </p>

          <form onSubmit={handleEvaluate} className="mt-4 grid gap-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-white/85">
              Upload CV (PDF/DOCX/TXT)
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={(event) => setCvFile(event.target.files?.[0] || null)}
                className={`${fieldBaseClass} file:mr-3 file:rounded-lg file:border-0 file:bg-gradient-to-r file:from-cyan-500 file:to-emerald-500 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white dark:file:from-cyan-400 dark:file:to-emerald-400`}
              />
            </label>

            <label className="block text-sm font-medium text-slate-700 dark:text-white/85">
              Candidate Meta (JSON, optional)
              <textarea
                rows={3}
                value={candidateMeta}
                onChange={(event) => setCandidateMeta(event.target.value)}
                className={fieldBaseClass}
              />
            </label>

            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-white/85">Choose Models</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { key: 'resume', label: 'Resume Parsing' },
                  { key: 'matching', label: 'Job Matching' },
                  { key: 'risk', label: 'Attrition Risk' },
                ].map((modelItem) => (
                  <button
                    key={modelItem.key}
                    type="button"
                    onClick={() => toggleModel(modelItem.key)}
                    className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                      selectedModels[modelItem.key]
                        ? 'border-slate-900 bg-slate-900 text-white dark:border-cyan-300/35 dark:bg-cyan-400/20 dark:text-cyan-100'
                        : 'border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-white/80'
                    }`}
                  >
                    {modelItem.label}
                  </button>
                ))}

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900">
                  <p className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-white/80">
                    <Lock className="h-3.5 w-3.5" />
                    Interview Eval
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-white/60">HR only</p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={evaluating || !isCandidate}
              className="btn-primary w-fit"
            >
              {evaluating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <SearchCheck className="h-4 w-4" />}
              Apply + Evaluate Selected Models
            </button>
            {evaluating ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-900">
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-white/85">
                  Processing
                  <span className="processing-dots">
                    <span />
                    <span />
                    <span />
                  </span>
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-white/60">
                  Parsing resume, scoring job fit, and calculating risk.
                </p>
                <div className="processing-bar mt-3">
                  <span />
                </div>
              </div>
            ) : null}
          </form>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="surface-card mt-4 p-5">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Evaluation Result</h2>

          {!result && !evaluating ? (
            <p className="mt-2 text-sm text-slate-500 dark:text-white/60">
              Select a job, upload CV, choose models, then run evaluation.
            </p>
          ) : null}

          {!result && evaluating ? (
            <div className="mt-3 space-y-3">
              <div className="shimmer-skeleton h-16" />
              <div className="shimmer-skeleton h-20" />
              <div className="shimmer-skeleton h-20" />
            </div>
          ) : null}

          {result ? (
            <div className="mt-3 space-y-3 text-sm">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-300/30 dark:bg-emerald-400/10">
                <p className="font-semibold text-emerald-800 dark:text-emerald-100">Application</p>
                <p className="mt-1 text-emerald-800 dark:text-emerald-100">
                  ID: {result?.application?.application_id || 'N/A'} | Status: {result?.application?.status || 'N/A'}
                </p>
                <p className="mt-1 text-emerald-800 dark:text-emerald-100">{result?.application?.message || ''}</p>
              </div>

              {result?.model_1_resume_parsing ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-900">
                  <p className="font-semibold text-slate-800 dark:text-white/90">Model 1 - Resume Parsing</p>
                  <p className="mt-1 text-slate-700 dark:text-white/80">
                    Candidate: {result?.model_1_resume_parsing?.candidate_name || 'N/A'} | Email: {result?.model_1_resume_parsing?.email || 'N/A'}
                  </p>
                  <p className="mt-1 text-slate-700 dark:text-white/80">
                    Skills: {(result?.model_1_resume_parsing?.skills_detected || []).join(', ') || 'N/A'}
                  </p>
                </div>
              ) : null}

              {result?.model_2_job_matching ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-900">
                  <p className="font-semibold text-slate-800 dark:text-white/90">Model 2 - Job Matching</p>
                  <p className="mt-1 text-slate-700 dark:text-white/80">
                    Fit Score: {Number(result?.model_2_job_matching?.fit_score_0_100 || 0).toFixed(2)} ({result?.model_2_job_matching?.fit_band || 'N/A'})
                  </p>
                  <p className="mt-1 text-slate-700 dark:text-white/80">{result?.model_2_job_matching?.summary || 'No summary'}</p>
                </div>
              ) : null}

              {result?.model_4_attrition_risk ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-900">
                  <p className="font-semibold text-slate-800 dark:text-white/90">Model 4 - Attrition Risk</p>
                  <p className="mt-1 text-slate-700 dark:text-white/80">
                    Risk: {result?.model_4_attrition_risk?.risk_band || 'N/A'} | Attrition Score: {Number(result?.model_4_attrition_risk?.attrition_risk_score_0_100 || 0).toFixed(2)}
                  </p>
                </div>
              ) : null}

              <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-3 dark:border-cyan-300/30 dark:bg-cyan-400/10">
                <p className="font-semibold text-cyan-800 dark:text-cyan-100">Overall Assessment</p>
                <p className="mt-1 text-cyan-800 dark:text-cyan-100">
                  Availability: {result?.overall_assessment?.availability_score_0_100 ?? 'N/A'} ({result?.overall_assessment?.availability_band || 'N/A'})
                </p>
                <p className="mt-1 text-cyan-800 dark:text-cyan-100">{result?.overall_assessment?.recommendation || ''}</p>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-300/30 dark:bg-amber-400/10">
                <p className="inline-flex items-center gap-1 font-semibold text-amber-800 dark:text-amber-100">
                  <Lock className="h-3.5 w-3.5" />
                  Interview Evaluation
                </p>
                <p className="mt-1 text-amber-800 dark:text-amber-100">
                  {result?.interview_evaluation?.message || 'Interview evaluation is HR-only.'}
                </p>
              </div>
            </div>
          ) : null}
        </motion.section>
          </>
        ) : null}
      </section>
    </main>
  )
}
