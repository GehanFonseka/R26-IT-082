import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  BriefcaseBusiness,
  CircleUserRound,
  FileText,
  LayoutDashboard,
  LoaderCircle,
  NotebookText,
  Send,
  Upload,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import WorkspaceShell from '../../shared/components/portal/WorkspaceShell'
import { useAuthSession } from '../../shared/context/AuthSessionContext'
import { useUserMode } from '../../shared/context/UserModeContext'
import { DEMO_CREDENTIALS, apiRequest } from '../../shared/utils/portalApi'

const CANDIDATE_MENU = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'jobs', label: 'Jobs', icon: BriefcaseBusiness },
  { key: 'applied', label: 'My Applied Jobs', icon: NotebookText },
  { key: 'profile', label: 'Profile', icon: CircleUserRound },
]

function statusPillClass(status) {
  const normalized = String(status || '').toLowerCase()
  if (normalized.includes('reject')) {
    return 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-300/35 dark:bg-rose-400/15 dark:text-rose-100'
  }
  if (normalized.includes('select')) {
    return 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-300/35 dark:bg-emerald-400/15 dark:text-emerald-100'
  }
  if (normalized.includes('shortlist')) {
    return 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-300/35 dark:bg-amber-400/15 dark:text-amber-100'
  }
  return 'border-slate-300 bg-slate-100 text-slate-700 dark:border-white/20 dark:bg-white/10 dark:text-white/85'
}

function JobImage({ src }) {
  if (src) {
    return <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
  }

  return (
    <div className="flex h-full items-center justify-center bg-slate-100 text-slate-400 dark:bg-slate-800">
      <BriefcaseBusiness className="h-8 w-8" />
    </div>
  )
}

function formatSalary(min, max) {
  const formatter = new Intl.NumberFormat('en-LK', {
    maximumFractionDigits: 0,
    style: 'currency',
    currency: 'LKR',
  })
  if (min && max) {
    return `${formatter.format(min)} - ${formatter.format(max)}`
  }
  if (min) {
    return `From ${formatter.format(min)}`
  }
  if (max) {
    return `Up to ${formatter.format(max)}`
  }
  return 'Salary not published'
}

export default function CandidateWorkspacePage() {
  const { section = 'dashboard', jobId = '' } = useParams()
  const navigate = useNavigate()
  const { mode, setMode } = useUserMode()
  const { sessions, isAuthenticated, logout, requestWithAuth } = useAuthSession()

  const [jobs, setJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [applyMessage, setApplyMessage] = useState('')
  const [applying, setApplying] = useState(false)
  const [cvFile, setCvFile] = useState(null)
  const [interviewAnswer, setInterviewAnswer] = useState('')

  const activeSection = jobId ? 'jobs' : CANDIDATE_MENU.some((item) => item.key === section) ? section : 'dashboard'
  const selectedJob = useMemo(
    () => jobs.find((item) => item.job_id === jobId) || null,
    [jobId, jobs],
  )

  useEffect(() => {
    if (mode !== 'candidate') {
      setMode('candidate')
    }
  }, [mode, setMode])

  useEffect(() => {
    let mounted = true
    async function loadData() {
      setLoading(true)
      setErrorMessage('')
      try {
        const [jobsPayload, applicationsPayload] = await Promise.all([
          apiRequest('/api/v1/public/jobs'),
          requestWithAuth('candidate', '/api/v1/candidates/applications'),
        ])
        if (!mounted) {
          return
        }
        setJobs(Array.isArray(jobsPayload?.jobs) ? jobsPayload.jobs : [])
        setApplications(Array.isArray(applicationsPayload) ? applicationsPayload : [])
      } catch (error) {
        if (!mounted) {
          return
        }
        setErrorMessage(error.message)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    if (isAuthenticated('candidate')) {
      loadData()
    }
    return () => {
      mounted = false
    }
  }, [isAuthenticated, requestWithAuth])

  const applicationsByVacancy = useMemo(() => {
    const map = new Map()
    for (const item of applications) {
      map.set(item.vacancy_id, item)
    }
    return map
  }, [applications])

  const summary = useMemo(() => {
    const totalApplied = applications.length
    const shortlisted = applications.filter((item) =>
      String(item.status || '').toLowerCase().includes('shortlist'),
    ).length
    const selected = applications.filter((item) =>
      String(item.status || '').toLowerCase().includes('select'),
    ).length
    return {
      totalJobs: jobs.length,
      totalApplied,
      shortlisted,
      selected,
    }
  }, [applications, jobs.length])

  const appliedRows = useMemo(
    () =>
      applications.map((item) => {
        const job = jobs.find((entry) => entry.job_id === item.vacancy_id)
        return {
          ...item,
          jobName: job?.job_name || item.vacancy_id,
          requiredSkills: job?.required_skills || [],
          job,
        }
      }),
    [applications, jobs],
  )

  async function handleApply(event) {
    event.preventDefault()
    if (!selectedJob) {
      return
    }
    if (!cvFile) {
      setApplyMessage('Please attach your CV before applying.')
      return
    }

    const formData = new FormData()
    formData.append('cv_file', cvFile)
    formData.append('requested_models', 'resume,credentials,matching,risk')
    formData.append(
      'interview_question',
      `Briefly explain why you are a strong fit for the ${selectedJob.job_name} role.`,
    )
    if (interviewAnswer.trim()) {
      formData.append('interview_answer', interviewAnswer.trim())
    }

    setApplying(true)
    setApplyMessage('')
    try {
      const payload = await requestWithAuth(
        'candidate',
        `/api/v1/public/jobs/${selectedJob.job_id}/evaluate-cv`,
        {
          method: 'POST',
          body: formData,
        },
      )
      setApplyMessage(payload?.application?.message || 'Application submitted to HR.')
      const applicationsPayload = await requestWithAuth('candidate', '/api/v1/candidates/applications')
      setApplications(Array.isArray(applicationsPayload) ? applicationsPayload : [])
    } catch (error) {
      setApplyMessage(error.message)
    } finally {
      setApplying(false)
    }
  }

  if (!isAuthenticated('candidate')) {
    return <Navigate to="/candidate" replace />
  }

  function renderSection() {
    if (loading) {
      return (
        <p className="inline-flex items-center gap-2 text-sm text-cyan-700 dark:text-cyan-200">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading candidate data...
        </p>
      )
    }

    if (activeSection === 'dashboard') {
      return (
        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="surface-card p-4">
              <p className="text-xs font-semibold text-slate-500 dark:text-white/60">Open Jobs</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{summary.totalJobs}</p>
            </div>
            <div className="surface-card p-4">
              <p className="text-xs font-semibold text-slate-500 dark:text-white/60">Applied Jobs</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{summary.totalApplied}</p>
            </div>
            <div className="surface-card p-4">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-100">Shortlisted</p>
              <p className="mt-2 text-2xl font-semibold text-amber-800 dark:text-amber-100">{summary.shortlisted}</p>
            </div>
            <div className="surface-card p-4">
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-100">Selected</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-800 dark:text-emerald-100">{summary.selected}</p>
            </div>
          </div>

          <div className="surface-card p-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Recent Application Status</h2>
            <div className="mt-3 space-y-2">
              {appliedRows.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-white/60">No applications yet.</p>
              ) : (
                appliedRows.slice(0, 6).map((item) => (
                  <div
                    key={item.application_id}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900"
                  >
                    <div className="grid gap-3 sm:grid-cols-[110px_minmax(0,1fr)]">
                      <div className="h-24">
                        <JobImage src={item.job?.image_url} />
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 p-3">
                        <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.jobName}</p>
                        <p className="text-xs text-slate-600 dark:text-white/65">
                          {item.job?.experience_level || 'Experience TBD'} | {item.job?.work_type || 'onsite'} | {item.job?.location || 'Location TBD'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-white/55">{item.application_id}</p>
                        </div>
                        <span className={`status-pill ${statusPillClass(item.status)}`}>{item.status}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )
    }

    if (jobId) {
      if (!selectedJob) {
        return (
          <div className="surface-card p-5">
            <button type="button" onClick={() => navigate('/candidate/jobs')} className="btn-secondary">
              <ArrowLeft className="h-4 w-4" />
              Back to jobs
            </button>
            <p className="mt-4 text-sm text-slate-600 dark:text-white/70">This job is no longer available.</p>
          </div>
        )
      }

      const applied = applicationsByVacancy.get(selectedJob.job_id)

      return (
        <div className="grid gap-4">
          <div className="surface-card overflow-hidden">
            <div className="grid gap-0 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
              <div className="min-h-[320px]">
                <JobImage src={selectedJob.image_url} />
              </div>
              <div className="p-5">
                <button type="button" onClick={() => navigate('/candidate/jobs')} className="btn-secondary">
                  <ArrowLeft className="h-4 w-4" />
                  Back to jobs
                </button>
                <div className="mt-5 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase text-cyan-700 dark:text-cyan-200">
                      {selectedJob.department || 'Open role'}
                    </p>
                    <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                      {selectedJob.job_name}
                    </h1>
                    <p className="mt-2 text-sm text-slate-600 dark:text-white/70">
                      {selectedJob.location || 'Location TBD'} | {selectedJob.work_type || 'onsite'} | {selectedJob.experience_level || 'Experience TBD'}
                    </p>
                  </div>
                  <span className={`status-pill ${applied ? statusPillClass(applied.status) : ''}`}>
                    {applied ? applied.status : 'Accepting applications'}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-700 dark:text-white/75">
                  {selectedJob.responsibilities || 'The recruiter has not added a detailed description yet.'}
                </p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-white/75">
                    <span className="block text-xs font-semibold text-slate-500 dark:text-white/50">Compensation</span>
                    {formatSalary(selectedJob.salary_min, selectedJob.salary_max)}
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-white/75">
                    <span className="block text-xs font-semibold text-slate-500 dark:text-white/50">Job ID</span>
                    {selectedJob.job_id}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {(selectedJob.required_skills || []).map((skill) => (
                    <span key={skill} className="status-pill">{skill}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <form onSubmit={handleApply} className="surface-card p-5">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-cyan-700 dark:text-cyan-200" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Apply for this role</h2>
              </div>
              <label className="mt-4 block text-sm font-medium text-slate-700 dark:text-white/85">
                Upload CV
                <span className="mt-2 flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center text-sm text-slate-600 transition hover:border-cyan-400 hover:bg-cyan-50/50 dark:border-white/15 dark:bg-slate-900 dark:text-white/70 dark:hover:border-cyan-300/40 dark:hover:bg-cyan-400/10">
                  <Upload className="mb-2 h-5 w-5" />
                  {cvFile ? cvFile.name : 'Choose a PDF, DOCX, or TXT CV'}
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,application/pdf,text/plain"
                    className="sr-only"
                    onChange={(event) => setCvFile(event.target.files?.[0] || null)}
                    disabled={Boolean(applied)}
                  />
                </span>
              </label>

              <label className="mt-4 block text-sm font-medium text-slate-700 dark:text-white/85">
                Short interview answer
                <textarea
                  value={interviewAnswer}
                  onChange={(event) => setInterviewAnswer(event.target.value)}
                  rows={5}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200/70 disabled:opacity-60 dark:border-white/10 dark:bg-slate-900 dark:text-white dark:focus:border-cyan-300 dark:focus:ring-cyan-400/25"
                  placeholder={`Briefly explain why you are a strong fit for the ${selectedJob.job_name} role.`}
                  disabled={Boolean(applied)}
                />
              </label>

              {applyMessage ? (
                <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-white/75">
                  {applyMessage}
                </p>
              ) : null}

              <button type="submit" disabled={applying || Boolean(applied)} className="btn-primary mt-4 disabled:cursor-not-allowed disabled:opacity-60">
                {applying ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {applied ? 'Already applied' : applying ? 'Submitting...' : 'Submit application'}
              </button>
            </form>
          </div>
        </div>
      )
    }

    if (activeSection === 'jobs') {
      return (
        <div className="surface-card p-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Available Jobs</h2>
          <p className="mt-1 text-xs text-slate-600 dark:text-white/65">
            Applied jobs are marked with live status from your candidate account.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {jobs.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-white/60">No jobs available right now.</p>
            ) : (
              jobs.map((job) => {
                const applied = applicationsByVacancy.get(job.job_id)
                return (
                  <div
                    key={job.job_id}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900"
                  >
                    <div className="h-40">
                      <JobImage src={job.image_url} />
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{job.job_name}</p>
                          <p className="mt-1 text-xs text-slate-600 dark:text-white/65">
                            {job.experience_level || 'Experience TBD'} | {job.work_type || 'onsite'}
                          </p>
                        </div>
                        {applied ? (
                          <span className={`status-pill ${statusPillClass(applied.status)}`}>{applied.status}</span>
                        ) : (
                          <span className="status-pill">Not Applied</span>
                        )}
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs text-slate-600 dark:text-white/70">
                        {job.responsibilities || 'No job description provided yet.'}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {(job.required_skills || []).slice(0, 5).map((skill) => (
                          <span key={skill} className="status-pill">{skill}</span>
                        ))}
                      </div>
                      <p className="mt-3 text-[11px] text-slate-500 dark:text-white/50">
                        {job.location || 'Location TBD'} | Job ID: {job.job_id}
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate(`/candidate/jobs/${job.job_id}`)}
                        className="btn-primary mt-4 w-full justify-center"
                      >
                        {applied ? 'View application' : 'View details and apply'}
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )
    }

    if (activeSection === 'applied') {
      return (
        <div className="surface-card p-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">My Applied Jobs</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {appliedRows.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-white/60">You have not applied for jobs yet.</p>
            ) : (
              appliedRows.map((item) => (
                <div
                  key={item.application_id}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900"
                >
                  <div className="h-40">
                    <JobImage src={item.job?.image_url} />
                  </div>
                  <div className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{item.jobName}</p>
                        <p className="mt-1 text-xs text-slate-600 dark:text-white/65">
                          {item.job?.experience_level || 'Experience TBD'} | {item.job?.work_type || 'onsite'} | {item.job?.location || 'Location TBD'}
                        </p>
                      </div>
                      <span className={`status-pill ${statusPillClass(item.status)}`}>{item.status}</span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs text-slate-600 dark:text-white/70">
                      {item.job?.responsibilities || 'No job description provided yet.'}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {(item.requiredSkills || []).slice(0, 5).map((skill) => (
                        <span key={skill} className="status-pill">{skill}</span>
                      ))}
                    </div>
                    <p className="mt-3 text-[11px] text-slate-500 dark:text-white/50">
                      Application ID: {item.application_id}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )
    }

    const user = sessions.candidate.user
    return (
      <div className="surface-card p-4">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Candidate Profile</h2>
        <div className="mt-3 space-y-2 text-sm text-slate-700 dark:text-white/80">
          <p>
            <strong>Name:</strong> {user?.name || 'Demo Candidate'}
          </p>
          <p>
            <strong>Email:</strong> {user?.email || DEMO_CREDENTIALS.candidate.email}
          </p>
          <p>
            <strong>Role:</strong> {user?.role || 'candidate'}
          </p>
        </div>
        <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-white/75">
          Demo login: {DEMO_CREDENTIALS.candidate.email} / {DEMO_CREDENTIALS.candidate.password}
        </p>
      </div>
    )
  }

  return (
    <WorkspaceShell
      mode={mode}
      title="Candidate Dashboard"
      subtitle="Track jobs and applications"
      navItems={CANDIDATE_MENU}
      activeItemKey={activeSection}
      onSelectItem={(nextKey) => navigate(`/candidate/${nextKey}`)}
      onLogout={() => {
        logout('candidate')
        navigate('/candidate', { replace: true })
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          {errorMessage ? (
            <p className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-300/25 dark:bg-rose-400/10 dark:text-rose-200">
              {errorMessage}
            </p>
          ) : null}
          {renderSection()}
        </motion.div>
      </AnimatePresence>
    </WorkspaceShell>
  )
}
