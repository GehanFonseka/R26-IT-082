import { AnimatePresence, motion } from 'framer-motion'
import {
  BarChart3,
  BriefcaseBusiness,
  BrainCircuit,
  ClipboardList,
  ChevronDown,
  CheckCircle2,
  Eye,
  FileText,
  Filter,
  LayoutDashboard,
  LoaderCircle,
  Mic,
  PlusCircle,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Square,
  StepForward,
  Users,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import WorkspaceShell from '../../shared/components/portal/WorkspaceShell'
import { useAuthSession } from '../../shared/context/AuthSessionContext'
import { useUserMode } from '../../shared/context/UserModeContext'
import { DEMO_CREDENTIALS, apiRequest } from '../../shared/utils/portalApi'

const HR_MENU = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'jobs', label: 'Jobs', icon: BriefcaseBusiness },
  { key: 'candidates', label: 'Candidates', icon: Users },
  { key: 'interviews', label: 'Interviews', icon: Mic },
  { key: 'post-jobs', label: 'Post Jobs', icon: PlusCircle },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
]

const fieldBaseClass =
  'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200/70 dark:border-white/10 dark:bg-slate-900 dark:text-white dark:focus:border-cyan-300 dark:focus:ring-cyan-400/25'

function hrStatusPillClass(status) {
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

function FunnelBars({ funnel }) {
  const entries = Object.entries(funnel || {}).filter(([, value]) => Number(value) > 0)
  const max = Math.max(...entries.map(([, value]) => Number(value)), 1)

  if (entries.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-white/60">No funnel data yet.</p>
  }

  return (
    <div className="space-y-2">
      {entries.map(([label, value]) => {
        const count = Number(value || 0)
        const width = `${Math.max(12, (count / max) * 100)}%`
        return (
          <div key={label}>
            <div className="mb-1 flex items-center justify-between text-xs text-slate-600 dark:text-white/70">
              <span>{label}</span>
              <span>{count}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-200 dark:bg-white/10">
              <div className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500" style={{ width }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function RiskChart({ distribution }) {
  const high = Number(distribution?.HIGH || 0)
  const medium = Number(distribution?.MEDIUM || 0)
  const low = Number(distribution?.LOW || 0)
  const total = high + medium + low

  if (total <= 0) {
    return <p className="text-sm text-slate-500 dark:text-white/60">No risk data yet.</p>
  }

  const highPct = (high / total) * 100
  const mediumPct = (medium / total) * 100

  const gradient = `conic-gradient(#fb7185 0 ${highPct}%, #fbbf24 ${highPct}% ${highPct + mediumPct}%, #34d399 ${highPct + mediumPct}% 100%)`

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-28 w-28 rounded-full" style={{ background: gradient }}>
        <div className="absolute inset-4 rounded-full bg-white dark:bg-slate-950" />
      </div>
      <div className="space-y-1 text-xs">
        <p className="text-rose-700 dark:text-rose-200">High: {high}</p>
        <p className="text-amber-700 dark:text-amber-200">Medium: {medium}</p>
        <p className="text-emerald-700 dark:text-emerald-200">Low: {low}</p>
        <p className="text-slate-500 dark:text-white/60">Total: {total}</p>
      </div>
    </div>
  )
}

function getSpeechRecognition() {
  if (typeof window === 'undefined') {
    return null
  }
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

function scoreBandClass(score) {
  if (score >= 75) {
    return 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-300/35 dark:bg-emerald-400/15 dark:text-emerald-100'
  }
  if (score >= 55) {
    return 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-300/35 dark:bg-amber-400/15 dark:text-amber-100'
  }
  return 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-300/35 dark:bg-rose-400/15 dark:text-rose-100'
}

function formatScore(value, decimals = 1) {
  const score = Number(value || 0)
  return Number.isFinite(score) ? score.toFixed(decimals) : Number(0).toFixed(decimals)
}

function ProgressLine({ value, tone = 'cyan' }) {
  const safeValue = Math.max(0, Math.min(100, Number(value || 0)))
  const colorClass = {
    cyan: 'from-cyan-500 to-sky-500',
    emerald: 'from-emerald-500 to-teal-500',
    amber: 'from-amber-500 to-orange-500',
    rose: 'from-rose-500 to-red-500',
  }[tone]

  return (
    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${safeValue}%` }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={`h-full rounded-full bg-gradient-to-r ${colorClass}`}
      />
    </div>
  )
}

function CandidateModelTile({
  title,
  Icon,
  tone,
  score,
  status,
  expanded,
  onToggle,
  children,
}) {
  const toneClass = {
    cyan: 'border-cyan-200 bg-cyan-50/80 dark:border-cyan-300/25 dark:bg-cyan-400/10',
    emerald: 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-300/25 dark:bg-emerald-400/10',
    amber: 'border-amber-200 bg-amber-50/80 dark:border-amber-300/25 dark:bg-amber-400/10',
    rose: 'border-rose-200 bg-rose-50/80 dark:border-rose-300/25 dark:bg-rose-400/10',
  }[tone]

  return (
    <motion.div layout className={`rounded-xl border ${toneClass} ${expanded ? 'md:col-span-2' : ''}`}>
      <button
        type="button"
        onClick={onToggle}
        className={`w-full p-3 ${expanded ? 'grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 text-left' : 'flex min-h-28 flex-col items-center justify-center gap-2 text-center'}`}
      >
        <span className={`${expanded ? 'h-9 w-9' : 'h-12 w-12'} inline-flex items-center justify-center rounded-xl border border-white/70 bg-white/80 text-slate-800 shadow-sm dark:border-white/10 dark:bg-slate-950/60 dark:text-white`}>
          <Icon className={expanded ? 'h-4 w-4' : 'h-5 w-5'} />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">{title}</span>
          {expanded ? <span className="mt-1 block text-[11px] text-slate-600 dark:text-white/65">{status}</span> : null}
        </span>
        <span className={`flex items-center gap-2 ${expanded ? '' : 'justify-center'}`}>
          <span className={expanded ? 'text-sm font-semibold text-slate-900 dark:text-white' : 'text-xl font-semibold text-slate-900 dark:text-white'}>
            {score}
          </span>
          {!expanded ? <span className="status-pill">{status}</span> : null}
          <ChevronDown className={`h-4 w-4 text-slate-500 transition ${expanded ? 'rotate-180' : ''}`} />
        </span>
      </button>
      {expanded ? (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="border-t border-white/70 p-3 text-xs text-slate-700 dark:border-white/10 dark:text-white/80"
        >
          {children}
        </motion.div>
      ) : null}
    </motion.div>
  )
}

function appliedJobLabel(application, jobs) {
  const job = jobs.find((item) => item.job_id === application?.vacancy_id)
  return job?.job_name || application?.vacancy_id || 'N/A'
}

export default function HrWorkspacePage() {
  const { section = 'dashboard' } = useParams()
  const navigate = useNavigate()
  const { mode, setMode } = useUserMode()
  const { isAuthenticated, logout, requestWithAuth } = useAuthSession()

  const [jobs, setJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [postMessage, setPostMessage] = useState('')
  const [posting, setPosting] = useState(false)
  const [jobName, setJobName] = useState('')
  const [requiredSkills, setRequiredSkills] = useState('')
  const [jobExperience, setJobExperience] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [jobImageUrl, setJobImageUrl] = useState('')
  const [jobWorkType, setJobWorkType] = useState('hybrid')
  const [jobLocation, setJobLocation] = useState('')
  const [interviewPhase, setInterviewPhase] = useState('question')
  const [questionText, setQuestionText] = useState('')
  const [answerText, setAnswerText] = useState('')
  const [recordingTarget, setRecordingTarget] = useState('')
  const [speechMessage, setSpeechMessage] = useState('')
  const [interviewScores, setInterviewScores] = useState([])
  const [evaluatingInterview, setEvaluatingInterview] = useState(false)
  const [candidateQuery, setCandidateQuery] = useState('')
  const [candidateStatusFilter, setCandidateStatusFilter] = useState('')
  const [candidateJobFilter, setCandidateJobFilter] = useState('')
  const [selectedApplicationId, setSelectedApplicationId] = useState('')
  const [bulkSelectedApplicationIds, setBulkSelectedApplicationIds] = useState([])
  const [bulkStatusBusy, setBulkStatusBusy] = useState(false)
  const [inlineStatusBusy, setInlineStatusBusy] = useState('')
  const [expandedCandidateModel, setExpandedCandidateModel] = useState('')
  const [candidateRecheckBusy, setCandidateRecheckBusy] = useState('')
  const [candidateRecheckResult, setCandidateRecheckResult] = useState(null)
  const [candidateInterviewQuestion, setCandidateInterviewQuestion] = useState('')
  const [candidateInterviewAnswer, setCandidateInterviewAnswer] = useState('')
  const [candidateInterviewHistory, setCandidateInterviewHistory] = useState({})
  const recognitionRef = useRef(null)
  const speechSessionRef = useRef({
    active: false,
    id: 0,
    restarts: 0,
    target: '',
  })
  const speechBaseTextRef = useRef('')
  const speechTranscriptRef = useRef('')

  const activeSection = HR_MENU.some((item) => item.key === section) ? section : 'dashboard'

  useEffect(() => {
    if (mode !== 'hr') {
      setMode('hr')
    }
  }, [mode, setMode])

  useEffect(() => {
    let mounted = true
    async function loadData() {
      setLoading(true)
      setErrorMessage('')
      try {
        const [jobsPayload, applicationsPayload, dashboardPayload] = await Promise.all([
          apiRequest('/api/v1/public/jobs'),
          requestWithAuth('hr', '/api/v1/recruiter/applications'),
          requestWithAuth('hr', '/api/v1/recruiter/dashboard'),
        ])

        if (!mounted) {
          return
        }
        setJobs(Array.isArray(jobsPayload?.jobs) ? jobsPayload.jobs : [])
        setApplications(Array.isArray(applicationsPayload) ? applicationsPayload : [])
        setDashboard(dashboardPayload || null)
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

    if (isAuthenticated('hr')) {
      loadData()
    }

    return () => {
      mounted = false
    }
  }, [isAuthenticated, requestWithAuth])

  useEffect(() => () => {
    if (recognitionRef.current) {
      speechSessionRef.current = {
        ...speechSessionRef.current,
        active: false,
        id: speechSessionRef.current.id + 1,
      }
      recognitionRef.current.abort()
      recognitionRef.current = null
    }
  }, [])

  const summary = useMemo(
    () => ({
      totalJobs: jobs.length,
      totalApplications: Number(dashboard?.total_applications || applications.length || 0),
      shortlisted: Number(dashboard?.funnel?.Shortlisted || 0),
      selected: Number(dashboard?.funnel?.Selected || 0),
    }),
    [applications.length, dashboard, jobs.length],
  )

  const jobsWithCounts = useMemo(() => {
    const counts = new Map()
    for (const app of applications) {
      const vacancyId = app.vacancy_id
      counts.set(vacancyId, (counts.get(vacancyId) || 0) + 1)
    }

    return jobs.map((job) => ({
      ...job,
      applicationCount: counts.get(job.job_id) || 0,
    }))
  }, [applications, jobs])

  const filteredApplications = useMemo(() => {
    const query = candidateQuery.trim().toLowerCase()
    const status = candidateStatusFilter.trim().toLowerCase()
    const job = candidateJobFilter.trim()

    return applications.filter((item) => {
      const searchable = [
        item.candidate_name,
        item.candidate_email,
        item.application_id,
        item.vacancy_id,
        item.status,
      ]
        .map((value) => String(value || '').toLowerCase())
        .join(' ')

      if (query && !searchable.includes(query)) {
        return false
      }
      if (status && String(item.status || '').toLowerCase() !== status) {
        return false
      }
      if (job && item.vacancy_id !== job) {
        return false
      }
      return true
    })
  }, [applications, candidateJobFilter, candidateQuery, candidateStatusFilter])

  const selectedApplication = useMemo(
    () =>
      filteredApplications.find((item) => item.application_id === selectedApplicationId) ||
      filteredApplications[0] ||
      null,
    [filteredApplications, selectedApplicationId],
  )

  const visibleApplicationIds = useMemo(
    () => filteredApplications.map((item) => item.application_id).filter(Boolean),
    [filteredApplications],
  )

  const selectedVisibleCount = useMemo(
    () => bulkSelectedApplicationIds.filter((id) => visibleApplicationIds.includes(id)).length,
    [bulkSelectedApplicationIds, visibleApplicationIds],
  )

  const selectedJob = useMemo(
    () => jobs.find((job) => job.job_id === candidateJobFilter) || null,
    [candidateJobFilter, jobs],
  )

  const latestCandidateApplication = candidateRecheckResult?.updated_application || selectedApplication
  const selectedApplicationJob = useMemo(
    () => jobs.find((job) => job.job_id === latestCandidateApplication?.vacancy_id) || null,
    [jobs, latestCandidateApplication?.vacancy_id],
  )
  const candidateResumeProfile = candidateRecheckResult?.model_1_resume_parsing || latestCandidateApplication?.resume
  const candidateCredentialEval =
    candidateRecheckResult?.model_1b_credential_validation ||
    latestCandidateApplication?.ai_scores?.credentials
  const candidateResumeXai = candidateResumeProfile?.explainable_ai || {}
  const candidateResumeStats = candidateResumeXai?.extraction_stats || {}
  const candidateSkillEvidence = candidateResumeXai?.skill_evidence || []
  const candidateResumeStatItems = [
    ['Words', candidateResumeStats.word_count],
    ['Lines', candidateResumeStats.line_count],
    ['Skills', candidateResumeStats.skill_count],
    ['Sections', candidateResumeStats.detected_section_count],
    ['Skill Density', candidateResumeStats.skill_density_per_100_words != null ? `${formatScore(candidateResumeStats.skill_density_per_100_words, 2)} / 100 words` : null],
    ['Required Coverage', candidateResumeStats.required_skill_coverage_0_100 != null ? `${formatScore(candidateResumeStats.required_skill_coverage_0_100)}%` : null],
    ['Completeness', candidateResumeStats.completeness_score_0_100 != null ? `${formatScore(candidateResumeStats.completeness_score_0_100)}%` : null],
  ].filter(([, value]) => value !== null && value !== undefined && value !== '')
  const candidateSectionSignals = Object.entries(candidateResumeXai?.section_signals || {}).filter(([, value]) => Number(value) > 0)
  const candidateInferredFields = candidateResumeProfile?.feature_inference?.inferred_fields || []
  const candidateRequiredSkillMatches = candidateResumeXai?.matched_required_skills || []
  const candidateTrainedResumeLabels = candidateResumeXai?.trained_model?.label_scores || []
  const candidateMatchingEval = candidateRecheckResult?.model_2_job_matching || {
    summary: latestCandidateApplication?.ai_scores?.matching_summary,
    details: latestCandidateApplication?.ai_scores?.matching,
    fit_score_0_100: latestCandidateApplication?.ai_scores?.fit_score_0_100,
    fit_band: latestCandidateApplication?.ai_scores?.fit_band,
  }
  const candidateInterviewEval = candidateRecheckResult?.model_3_interview_evaluation || latestCandidateApplication?.ai_scores?.interview
  const candidateRiskEval = candidateRecheckResult?.model_4_attrition_risk || latestCandidateApplication?.ai_scores?.risk
  const candidateMatchingScore = Number(candidateMatchingEval?.fit_score_0_100 || candidateMatchingEval?.details?.score_0_100 || 0)
  const candidateInterviewScore = Number(candidateInterviewEval?.overall_score_0_100 || 0)
  const candidateRiskScore = Number(candidateRiskEval?.attrition_risk_score_0_100 || 0)
  const currentCandidateInterviewHistory = useMemo(
    () => candidateInterviewHistory[latestCandidateApplication?.application_id] || [],
    [candidateInterviewHistory, latestCandidateApplication?.application_id],
  )
  const candidateInterviewFinalScore = useMemo(() => {
    if (currentCandidateInterviewHistory.length === 0) {
      return candidateInterviewScore
    }
    const total = currentCandidateInterviewHistory.reduce(
      (sum, item) => sum + Number(item.evaluation?.overall_score_0_100 || 0),
      0,
    )
    return total / currentCandidateInterviewHistory.length
  }, [candidateInterviewScore, currentCandidateInterviewHistory])

  const candidateAnalytics = useMemo(() => {
    const statusCounts = {
      applied: 0,
      shortlisted: 0,
      interviewed: 0,
      selected: 0,
      rejected: 0,
    }
    const matchingBands = {
      high: 0,
      medium: 0,
      low: 0,
    }
    let fitTotal = 0
    let fitCount = 0
    let interviewCount = 0
    let interviewTotal = 0
    let highRisk = 0
    const jobCounts = new Map()

    for (const app of applications) {
      const normalizedStatus = String(app.status || '').toLowerCase()
      if (normalizedStatus.includes('shortlist')) {
        statusCounts.shortlisted += 1
      } else if (normalizedStatus.includes('interview')) {
        statusCounts.interviewed += 1
      } else if (normalizedStatus.includes('select')) {
        statusCounts.selected += 1
      } else if (normalizedStatus.includes('reject')) {
        statusCounts.rejected += 1
      } else {
        statusCounts.applied += 1
      }

      const fit = Number(app?.ai_scores?.fit_score_0_100 || app?.ai_scores?.matching?.score_0_100 || 0)
      if (Number.isFinite(fit) && fit > 0) {
        fitTotal += fit
        fitCount += 1
        if (fit >= 75) {
          matchingBands.high += 1
        } else if (fit >= 50) {
          matchingBands.medium += 1
        } else {
          matchingBands.low += 1
        }
      }

      const interview = Number(app?.ai_scores?.interview?.overall_score_0_100 || 0)
      if (Number.isFinite(interview) && interview > 0) {
        interviewTotal += interview
        interviewCount += 1
      }

      if (String(app?.ai_scores?.risk?.risk_band || '').toUpperCase() === 'HIGH') {
        highRisk += 1
      }

      if (app.vacancy_id) {
        jobCounts.set(app.vacancy_id, (jobCounts.get(app.vacancy_id) || 0) + 1)
      }
    }

    const candidateInterviewHistoryCount = Object.values(candidateInterviewHistory).reduce(
      (total, items) => total + items.length,
      0,
    )

    const topJobs = [...jobCounts.entries()]
      .map(([jobId, count]) => ({
        jobId,
        count,
        name: jobs.find((job) => job.job_id === jobId)?.job_name || jobId,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return {
      total: applications.length,
      statusCounts,
      matchingBands,
      averageFit: fitCount ? fitTotal / fitCount : 0,
      averageInterview: interviewCount ? interviewTotal / interviewCount : 0,
      interviewCount,
      candidateInterviewHistoryCount,
      highRisk,
      topJobs,
    }
  }, [applications, candidateInterviewHistory, jobs])

  async function handlePostJob(event) {
    event.preventDefault()
    setPostMessage('')
    setErrorMessage('')

    if (!jobName.trim()) {
      setErrorMessage('Job name is required.')
      return
    }

    if (!requiredSkills.trim()) {
      setErrorMessage('Required skills are required.')
      return
    }

    setPosting(true)
    try {
      await requestWithAuth('hr', '/api/v1/public/jobs', {
        method: 'POST',
        body: {
          job_name: jobName.trim(),
          required_skills: requiredSkills.trim(),
          experience_level: jobExperience.trim() || 'Not specified',
          responsibilities: jobDescription.trim(),
          image_url: jobImageUrl.trim(),
          work_type: jobWorkType,
          location: jobLocation.trim(),
        },
      })

      setJobName('')
      setRequiredSkills('')
      setJobExperience('')
      setJobDescription('')
      setJobImageUrl('')
      setJobWorkType('hybrid')
      setJobLocation('')
      setPostMessage('Job posted successfully.')

      const jobsPayload = await apiRequest('/api/v1/public/jobs')
      setJobs(Array.isArray(jobsPayload?.jobs) ? jobsPayload.jobs : [])
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setPosting(false)
    }
  }

  async function updateInlineCandidateStatus(applicationId, status) {
    setInlineStatusBusy(status)
    setErrorMessage('')
    try {
      const payload = await requestWithAuth('hr', `/api/v1/applications/${applicationId}/status`, {
        method: 'PATCH',
        body: {
          status,
          note: `Manual HR status update: ${status}`,
        },
      })
      if (payload?.application_id) {
        setApplications((prev) =>
          prev.map((item) => (item.application_id === payload.application_id ? payload : item)),
        )
      }
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setInlineStatusBusy('')
    }
  }

  function toggleBulkCandidate(applicationId) {
    setBulkSelectedApplicationIds((prev) =>
      prev.includes(applicationId)
        ? prev.filter((id) => id !== applicationId)
        : [...prev, applicationId],
    )
  }

  function selectVisibleCandidates() {
    setBulkSelectedApplicationIds((prev) => {
      const next = new Set(prev)
      visibleApplicationIds.forEach((id) => next.add(id))
      return [...next]
    })
  }

  async function bulkShortlistCandidates() {
    const selectedIds = bulkSelectedApplicationIds.filter((id) => visibleApplicationIds.includes(id))
    if (selectedIds.length === 0) {
      setErrorMessage('Select one or more visible candidates first.')
      return
    }

    setBulkStatusBusy(true)
    setErrorMessage('')
    try {
      const updates = await Promise.all(
        selectedIds.map((applicationId) =>
          requestWithAuth('hr', `/api/v1/applications/${applicationId}/status`, {
            method: 'PATCH',
            body: {
              status: 'Shortlisted',
              note: 'Bulk HR shortlist from candidates dashboard',
            },
          }),
        ),
      )
      const updateMap = new Map(
        updates
          .filter((item) => item?.application_id)
          .map((item) => [item.application_id, item]),
      )
      setApplications((prev) =>
        prev.map((item) => updateMap.get(item.application_id) || item),
      )
      setBulkSelectedApplicationIds((prev) => prev.filter((id) => !selectedIds.includes(id)))
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setBulkStatusBusy(false)
    }
  }

  async function runCandidateModelRecheck(modelKey) {
    if (!latestCandidateApplication?.application_id) {
      setErrorMessage('Select a candidate first.')
      return
    }

    const resolvedInterviewQuestion = candidateInterviewQuestion.trim() || questionText.trim()
    const resolvedInterviewAnswer = candidateInterviewAnswer.trim() || answerText.trim()

    if (modelKey === 'interview' && !resolvedInterviewAnswer) {
      setErrorMessage('Type or record the candidate answer before scoring the interview model.')
      return
    }

    setCandidateRecheckBusy(modelKey)
    setErrorMessage('')
    try {
      const body = {
        requested_models: [modelKey],
        persist_results: true,
      }
      if (modelKey === 'interview') {
        body.interview_answer = resolvedInterviewAnswer
        if (resolvedInterviewQuestion) {
          body.interview_question = resolvedInterviewQuestion
        }
      }

      const payload = await requestWithAuth('hr', `/api/v1/recruiter/applications/${latestCandidateApplication.application_id}/recheck`, {
        method: 'POST',
        body,
      })
      setCandidateRecheckResult(payload || null)

      if (modelKey === 'interview' && payload?.model_3_interview_evaluation) {
        const historyItem = {
          id: payload.model_3_interview_evaluation.request_id || `CAND-INT-${Date.now()}`,
          question: resolvedInterviewQuestion || 'Interview question not provided',
          answer: resolvedInterviewAnswer,
          evaluation: payload.model_3_interview_evaluation,
        }
        setCandidateInterviewHistory((prev) => ({
          ...prev,
          [latestCandidateApplication.application_id]: [
            ...(prev[latestCandidateApplication.application_id] || []),
            historyItem,
          ],
        }))
        setCandidateInterviewQuestion('')
        setCandidateInterviewAnswer('')
        setQuestionText('')
        setAnswerText('')
      }

      const updated = payload?.updated_application
      if (updated?.application_id) {
        setApplications((prev) =>
          prev.map((item) => (item.application_id === updated.application_id ? updated : item)),
        )
      }
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setCandidateRecheckBusy('')
    }
  }

  function openCandidateCv() {
    if (!latestCandidateApplication?.resume) {
      setErrorMessage('No CV data is available for this candidate.')
      return
    }
    setExpandedCandidateModel('resume')
  }

  function stopRecording() {
    speechSessionRef.current = {
      ...speechSessionRef.current,
      active: false,
      id: speechSessionRef.current.id + 1,
    }

    if (recognitionRef.current) {
      recognitionRef.current.abort()
      recognitionRef.current = null
    }

    setRecordingTarget('')
  }

  function startRecording(target) {
    const Recognition = getSpeechRecognition()
    if (!Recognition) {
      setSpeechMessage('Speech-to-text is not supported in this browser. Type the text manually.')
      return
    }

    if (recognitionRef.current) {
      stopRecording()
    }

    const nextSession = {
      active: true,
      id: speechSessionRef.current.id + 1,
      restarts: 0,
      target,
    }
    speechSessionRef.current = nextSession
    speechBaseTextRef.current = target === 'question' ? questionText.trim() : answerText.trim()
    speechTranscriptRef.current = ''

    setSpeechMessage('')
    setRecordingTarget(target)
    startSpeechRecognition(target, nextSession.id)
  }

  function startSpeechRecognition(target, sessionId) {
    const Recognition = getSpeechRecognition()
    if (!Recognition) {
      setSpeechMessage('Speech-to-text is not supported in this browser. Type the text manually.')
      return
    }

    if (!speechSessionRef.current.active || speechSessionRef.current.id !== sessionId) {
      return
    }

    const recognition = new Recognition()
    recognition.lang = 'en-US'
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event) => {
      if (speechSessionRef.current.id !== sessionId) {
        return
      }

      let interimTranscript = ''
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index][0]?.transcript || ''
        if (event.results[index].isFinal) {
          speechTranscriptRef.current = `${speechTranscriptRef.current} ${transcript}`.replace(/\s+/g, ' ').trim()
        } else {
          interimTranscript += transcript
        }
      }

      const nextText = `${speechBaseTextRef.current} ${speechTranscriptRef.current} ${interimTranscript}`
        .replace(/\s+/g, ' ')
        .trim()
      if (target === 'question') {
        setQuestionText(nextText)
      } else {
        setAnswerText(nextText)
      }
    }

    recognition.onerror = (event) => {
      const error = event?.error || ''
      const session = speechSessionRef.current

      if (session.id !== sessionId) {
        return
      }

      if (recognitionRef.current === recognition) {
        recognitionRef.current = null
      }

      if (error === 'aborted' || error === 'network') {
        if (session.active && session.restarts < 5) {
          speechSessionRef.current = {
            ...session,
            restarts: session.restarts + 1,
          }
          window.setTimeout(() => {
            if (speechSessionRef.current.active && speechSessionRef.current.id === sessionId) {
              startSpeechRecognition(target, sessionId)
            }
          }, 350)
          return
        }

        speechSessionRef.current = {
          ...session,
          active: false,
        }
        setRecordingTarget('')
        setSpeechMessage('The browser stopped speech recognition before it could capture audio. Refresh the page, allow microphone access, or type the text manually.')
        return
      }

      speechSessionRef.current = {
        ...session,
        active: false,
      }
      setRecordingTarget('')

      if (error === 'not-allowed' || error === 'service-not-allowed') {
        setSpeechMessage('Microphone permission is blocked. Allow microphone access for this site, then try again.')
        return
      }

      if (error === 'audio-capture') {
        setSpeechMessage('No microphone was found. Check the input device and try again.')
        return
      }

      if (error === 'no-speech') {
        setSpeechMessage('No speech was detected. Try again, or type the text manually.')
        return
      }

      setSpeechMessage(error ? `Speech recognition error: ${error}` : 'Unable to record audio.')
    }

    recognition.onend = () => {
      const session = speechSessionRef.current
      if (session.id !== sessionId) {
        return
      }

      if (recognitionRef.current === recognition) {
        recognitionRef.current = null
      }

      if (session.active && session.restarts < 5) {
        speechSessionRef.current = {
          ...session,
          restarts: session.restarts + 1,
        }
        window.setTimeout(() => {
          if (speechSessionRef.current.active && speechSessionRef.current.id === sessionId) {
            startSpeechRecognition(target, sessionId)
          }
        }, 150)
        return
      }

      if (session.active) {
        speechSessionRef.current = {
          ...session,
          active: false,
        }
        setRecordingTarget('')
        setSpeechMessage('The browser speech service keeps stopping. Refresh the page, allow microphone access, or type the text manually.')
      }
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
    } catch (error) {
      const session = speechSessionRef.current
      if (session.id !== sessionId) {
        return
      }

      if (session.active && session.restarts < 5) {
        speechSessionRef.current = {
          ...session,
          restarts: session.restarts + 1,
        }
        window.setTimeout(() => {
          if (speechSessionRef.current.active && speechSessionRef.current.id === sessionId) {
            startSpeechRecognition(target, sessionId)
          }
        }, 350)
        return
      }

      recognitionRef.current = null
      speechSessionRef.current = {
        ...session,
        active: false,
      }
      setRecordingTarget('')
      setSpeechMessage(error?.message || 'Unable to start speech recognition. Refresh the page and try again.')
    }
  }

  function handleInterviewPrimaryAction() {
    if (recordingTarget) {
      stopRecording()
      return
    }

    if (interviewPhase === 'question') {
      if (!questionText.trim()) {
        startRecording('question')
        return
      }
      setInterviewPhase('answer')
      return
    }

    if (!answerText.trim()) {
      startRecording('answer')
      return
    }

    handleEvaluateInterview()
  }

  async function handleEvaluateInterview() {
    const cleanQuestion = questionText.trim()
    const cleanAnswer = answerText.trim()
    setSpeechMessage('')

    if (!cleanQuestion) {
      setSpeechMessage('Record or type the HR question first.')
      setInterviewPhase('question')
      return
    }
    if (!cleanAnswer) {
      setSpeechMessage('Record or type the candidate answer first.')
      setInterviewPhase('answer')
      return
    }

    setEvaluatingInterview(true)
    try {
      const result = await requestWithAuth('hr', '/api/v1/interview/evaluate', {
        method: 'POST',
        body: {
          question_text: cleanQuestion,
          answer_text: cleanAnswer,
        },
      })
      setInterviewScores((current) => [
        ...current,
        {
          id: result.request_id || `INT-${Date.now()}`,
          question: cleanQuestion,
          answer: cleanAnswer,
          evaluation: result,
        },
      ])
      setQuestionText('')
      setAnswerText('')
      setInterviewPhase('question')
      setSpeechMessage('Answer scored. Record the next question when ready.')
    } catch (error) {
      setSpeechMessage(error.message)
    } finally {
      setEvaluatingInterview(false)
    }
  }

  function handleResetInterview() {
    stopRecording()
    setQuestionText('')
    setAnswerText('')
    setInterviewPhase('question')
    setSpeechMessage('')
    setInterviewScores([])
  }

  if (!isAuthenticated('hr')) {
    return <Navigate to="/hr" replace />
  }

  function renderSection() {
    if (loading) {
      return (
        <p className="inline-flex items-center gap-2 text-sm text-cyan-700 dark:text-cyan-200">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading HR workspace...
        </p>
      )
    }

    if (activeSection === 'dashboard') {
      return (
        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="surface-card p-4">
              <p className="text-xs font-semibold text-slate-500 dark:text-white/60">Jobs</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{summary.totalJobs}</p>
            </div>
            <div className="surface-card p-4">
              <p className="text-xs font-semibold text-slate-500 dark:text-white/60">Applications</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{summary.totalApplications}</p>
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

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="surface-card p-4">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Hiring Funnel</h2>
              <div className="mt-3">
                <FunnelBars funnel={dashboard?.funnel || {}} />
              </div>
            </div>
            <div className="surface-card p-4">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Risk Distribution</h2>
              <div className="mt-3">
                <RiskChart distribution={dashboard?.risk_distribution || {}} />
              </div>
            </div>
          </div>
        </div>
      )
    }

    if (activeSection === 'jobs') {
      return (
        <div className="surface-card p-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">All Jobs</h2>
          <div className="mt-3 space-y-2">
            {jobsWithCounts.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-white/60">No jobs available.</p>
            ) : (
              jobsWithCounts.map((job) => (
                <button
                  key={job.job_id}
                  type="button"
                  onClick={() => {
                    setCandidateJobFilter(job.job_id)
                    setSelectedApplicationId('')
                    navigate('/hr/candidates')
                  }}
                  className="block w-full overflow-hidden rounded-xl border border-slate-200 bg-white text-left transition hover:border-cyan-300 hover:bg-cyan-50/50 dark:border-white/10 dark:bg-slate-900 dark:hover:border-cyan-300/35 dark:hover:bg-cyan-400/10"
                >
                  <div className="grid gap-3 md:grid-cols-[160px_minmax(0,1fr)]">
                    <div className="h-36 bg-slate-100 dark:bg-slate-800 md:h-full">
                      {job.image_url ? (
                        <img src={job.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-slate-400">
                          <BriefcaseBusiness className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap items-start justify-between gap-2 p-3">
                      <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{job.job_name}</p>
                      <p className="mt-1 text-xs text-slate-600 dark:text-white/65">
                        Skills: {(job.required_skills || []).join(', ') || 'Not specified'}
                      </p>
                      <p className="mt-1 text-xs text-slate-600 dark:text-white/65">
                        Experience: {job.experience_level || 'Not specified'} | {job.work_type || 'onsite'} | {job.location || 'Location TBD'}
                      </p>
                      <p className="mt-2 line-clamp-2 text-xs text-slate-500 dark:text-white/55">
                        {job.responsibilities || 'No job description provided yet.'}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500 dark:text-white/50">Job ID: {job.job_id}</p>
                    </div>
                    <span className="status-pill">{job.applicationCount} candidates</span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )
    }

    if (activeSection === 'candidates') {
      return (
        <div className="grid gap-4 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
          <div className="surface-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Candidates</h2>
                <p className="mt-1 text-xs text-slate-600 dark:text-white/65">
                  {selectedJob ? `Filtered by ${selectedJob.job_name}` : 'Search, filter, and review inside the HR dashboard.'}
                </p>
              </div>
              <span className="status-pill">{filteredApplications.length} / {applications.length}</span>
            </div>

            <div className="mt-3 grid gap-2 md:grid-cols-3 xl:grid-cols-1">
              <label className="text-xs font-medium text-slate-700 dark:text-white/85">
                Search
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={candidateQuery}
                    onChange={(event) => setCandidateQuery(event.target.value)}
                    className={`${fieldBaseClass} pl-9`}
                    placeholder="Name, email, ID..."
                  />
                </div>
              </label>
              <label className="text-xs font-medium text-slate-700 dark:text-white/85">
                Status
                <select
                  value={candidateStatusFilter}
                  onChange={(event) => setCandidateStatusFilter(event.target.value)}
                  className={fieldBaseClass}
                >
                  <option value="">All statuses</option>
                  <option value="applied">Applied</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="interviewed">Interviewed</option>
                  <option value="selected">Selected</option>
                  <option value="rejected">Rejected</option>
                </select>
              </label>
              <label className="text-xs font-medium text-slate-700 dark:text-white/85">
                Job
                <select
                  value={candidateJobFilter}
                  onChange={(event) => {
                    setCandidateJobFilter(event.target.value)
                    setSelectedApplicationId('')
                  }}
                  className={fieldBaseClass}
                >
                  <option value="">All jobs</option>
                  {jobs.map((job) => (
                    <option key={job.job_id} value={job.job_id}>{job.job_name}</option>
                  ))}
                </select>
              </label>
            </div>

            {(candidateQuery || candidateStatusFilter || candidateJobFilter) ? (
              <button
                type="button"
                className="btn-secondary mt-3"
                onClick={() => {
                  setCandidateQuery('')
                  setCandidateStatusFilter('')
                  setCandidateJobFilter('')
                  setSelectedApplicationId('')
                  setBulkSelectedApplicationIds([])
                }}
              >
                <Filter className="h-3.5 w-3.5" />
                Clear Filters
              </button>
            ) : null}

            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-900">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold text-slate-700 dark:text-white/80">
                  {selectedVisibleCount} selected from {filteredApplications.length} visible
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={selectVisibleCandidates}
                    disabled={filteredApplications.length === 0 || bulkStatusBusy}
                  >
                    Select visible
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setBulkSelectedApplicationIds([])}
                    disabled={bulkSelectedApplicationIds.length === 0 || bulkStatusBusy}
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={bulkShortlistCandidates}
                    disabled={selectedVisibleCount === 0 || bulkStatusBusy}
                  >
                    {bulkStatusBusy ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : null}
                    Shortlist selected
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 max-h-[620px] space-y-2 overflow-y-auto pr-1">
              {filteredApplications.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-white/60">No candidates found for the current filters.</p>
              ) : (
                filteredApplications.map((item) => {
                  const isActive = selectedApplication?.application_id === item.application_id
                  const isBulkSelected = bulkSelectedApplicationIds.includes(item.application_id)
                  const appliedJob = appliedJobLabel(item, jobs)
                  return (
                    <div
                      key={item.application_id}
                      className={`grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-xl border px-3 py-3 transition ${
                        isActive
                          ? 'border-cyan-300 bg-cyan-50 dark:border-cyan-300/35 dark:bg-cyan-400/15'
                          : 'border-slate-200 bg-white hover:border-cyan-200 dark:border-white/10 dark:bg-slate-900 dark:hover:border-cyan-300/30'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isBulkSelected}
                        onChange={() => toggleBulkCandidate(item.application_id)}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                        aria-label={`Select ${item.candidate_name || item.candidate_email || item.application_id}`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedApplicationId(item.application_id)
                          setCandidateRecheckResult(null)
                          setExpandedCandidateModel('')
                          setCandidateInterviewQuestion('')
                          setCandidateInterviewAnswer('')
                        }}
                        className="min-w-0 text-left"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                              {item.candidate_name || item.candidate_email}
                            </p>
                            <p className="mt-1 text-xs text-slate-600 dark:text-white/65">
                              {item.application_id} | {appliedJob}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-500 dark:text-white/55">
                              Applied job: {appliedJob} ({item.vacancy_id || 'N/A'})
                            </p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-white/55">
                              Fit {Number(item?.ai_scores?.fit_score_0_100 || 0).toFixed(1)} | Risk {item?.ai_scores?.risk?.risk_band || 'N/A'}
                            </p>
                          </div>
                          <span className={`status-pill ${hrStatusPillClass(item.status)}`}>{item.status}</span>
                        </div>
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div className="surface-card p-4">
            {!selectedApplication ? (
              <p className="text-sm text-slate-500 dark:text-white/60">Select a candidate to view details.</p>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="accent-chip">
                      <Eye className="h-3.5 w-3.5" />
                      Inline Review
                    </p>
                    <h3 className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">
                      {selectedApplication.candidate_name || selectedApplication.candidate_email}
                    </h3>
                    <p className="mt-1 text-xs text-slate-600 dark:text-white/65">
                      {latestCandidateApplication.candidate_email || 'No email'} | {latestCandidateApplication.application_id}
                    </p>
                    <p className="mt-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 dark:border-white/10 dark:bg-slate-950/70 dark:text-white/80">
                      <BriefcaseBusiness className="h-3.5 w-3.5" />
                      Applied job: {appliedJobLabel(latestCandidateApplication, jobs)}
                    </p>
                    {selectedApplicationJob ? (
                      <p className="mt-2 max-w-xl text-xs text-slate-500 dark:text-white/55">
                        Required skills: {(selectedApplicationJob.required_skills || []).join(', ') || 'Not specified'}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" className="btn-secondary" onClick={openCandidateCv}>
                      <FileText className="h-3.5 w-3.5" />
                      View CV
                    </button>
                    <span className={`status-pill ${hrStatusPillClass(latestCandidateApplication.status)}`}>{latestCandidateApplication.status}</span>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-300/25 dark:bg-emerald-400/10">
                    <p className="text-[11px] font-semibold uppercase text-emerald-800 dark:text-emerald-100">Fit</p>
                    <p className="mt-1 text-xl font-semibold text-emerald-900 dark:text-emerald-100">
                      {formatScore(candidateMatchingScore)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-300/25 dark:bg-amber-400/10">
                    <p className="text-[11px] font-semibold uppercase text-amber-800 dark:text-amber-100">Interview</p>
                    <p className="mt-1 text-xl font-semibold text-amber-900 dark:text-amber-100">
                      {formatScore(candidateInterviewFinalScore)}
                    </p>
                    <p className="mt-1 text-[11px] text-amber-800/75 dark:text-amber-100/75">
                      {currentCandidateInterviewHistory.length} scored
                    </p>
                  </div>
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 dark:border-rose-300/25 dark:bg-rose-400/10">
                    <p className="text-[11px] font-semibold uppercase text-rose-800 dark:text-rose-100">Risk</p>
                    <p className="mt-1 text-xl font-semibold text-rose-900 dark:text-rose-100">
                      {candidateRiskEval?.risk_band || 'N/A'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-3 dark:border-cyan-300/25 dark:bg-cyan-400/10">
                    <p className="text-[11px] font-semibold uppercase text-cyan-800 dark:text-cyan-100">Decision</p>
                    <p className="mt-1 text-sm font-semibold text-cyan-900 dark:text-cyan-100">
                      {latestCandidateApplication?.ai_scores?.ai_recommendation || candidateRecheckResult?.ai_recommendation || 'Pending'}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950/70">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Model Recheck Drawer</h4>
                      <p className="mt-1 text-xs text-slate-600 dark:text-white/65">Click an icon to expand, rerun the model, and inspect results.</p>
                    </div>
                    {candidateRecheckResult ? <span className="status-pill">Latest recheck loaded</span> : null}
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <CandidateModelTile
                      title="Resume"
                      Icon={FileText}
                      tone="cyan"
                      score={(candidateResumeProfile?.skills_detected || candidateResumeProfile?.skills || []).length}
                      status="M1"
                      expanded={expandedCandidateModel === 'resume'}
                      onToggle={() => setExpandedCandidateModel(expandedCandidateModel === 'resume' ? '' : 'resume')}
                    >
                      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
	                        <div className="space-y-1">
	                          <p>Candidate: {candidateResumeProfile?.candidate_name || latestCandidateApplication.candidate_name || 'N/A'}</p>
	                          <p>Email: {candidateResumeProfile?.email || latestCandidateApplication.candidate_email || 'N/A'}</p>
	                          <p>File: {candidateResumeProfile?.file_name || latestCandidateApplication?.resume?.file_name || latestCandidateApplication?.resume?.source || 'N/A'}</p>
	                          {/* <p>Skills: {(candidateResumeProfile?.skills_detected || candidateResumeProfile?.skills || []).join(', ') || 'N/A'}</p>
	                          {candidateResumeStatItems.length ? (
	                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
	                              {candidateResumeStatItems.map(([label, value]) => (
	                              <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-slate-900">
	                                <p className="text-[10px] font-semibold uppercase text-slate-500 dark:text-white/45">{label}</p>
	                                <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{value}</p>
	                              </div>
	                              ))}
	                            </div>
	                          ) : null} */}
	                          {(candidateRequiredSkillMatches.length > 0 || candidateSkillEvidence.length > 0 || candidateTrainedResumeLabels.length > 0) ? (
                              <motion.div 
                                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
                                className="mt-4 relative overflow-hidden rounded-2xl border border-indigo-100/50 bg-gradient-to-b from-indigo-50/30 to-white/60 p-4 shadow-sm backdrop-blur-xl dark:border-indigo-500/20 dark:from-indigo-950/20 dark:to-slate-900/60">
                                {/* Decorative background elements */}
                                <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl dark:bg-cyan-500/20" />
                                <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-indigo-400/10 blur-3xl dark:bg-indigo-500/20" />
                                
                                <div className="relative z-10">
                                  <div className="mb-4 flex items-center gap-2 border-b border-indigo-100/50 pb-3 dark:border-indigo-500/20">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 text-white shadow-md">
                                      <Sparkles className="h-4 w-4" />
                                    </div>
                                    <h4 className="text-sm font-bold tracking-tight text-slate-800 dark:text-slate-100">AI Extraction Logic</h4>
                                  </div>
                                  
                                  <div className="space-y-5">
                                    {candidateTrainedResumeLabels.length > 0 && (
                                      <div>
                                        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-indigo-500/80 dark:text-indigo-400/80">Classified Attributes</p>
                                        <div className="grid gap-2 sm:grid-cols-2">
                                          {candidateTrainedResumeLabels.slice(0, 4).map((item, i) => (
                                            <motion.div 
                                              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
                                              key={item.label} 
                                              className="group relative overflow-hidden rounded-xl border border-white/60 bg-white/40 p-3 transition-all hover:border-indigo-300 hover:bg-white hover:shadow-md dark:border-slate-700/40 dark:bg-slate-800/30 dark:hover:border-indigo-500/50 dark:hover:bg-slate-800/80">
                                              <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)] dark:bg-indigo-400" />
                                                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{item.description}</span>
                                              </div>
                                              {item.evidence_terms?.length > 0 && (
                                                <div className="mt-2 pl-3.5">
                                                  <p className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
                                                    <span className="font-medium text-slate-700 dark:text-slate-300">Evidence:</span> {item.evidence_terms.join(', ')}
                                                  </p>
                                                </div>
                                              )}
                                            </motion.div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {candidateRequiredSkillMatches.length > 0 && (
                                      <div>
                                        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-emerald-600/80 dark:text-emerald-400/80">Matched Requirements</p>
                                        <div className="flex flex-wrap gap-2">
                                          {candidateRequiredSkillMatches.map((skill, i) => (
                                            <motion.span 
                                              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 + i * 0.05 }}
                                              key={skill} 
                                              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200/80 bg-gradient-to-b from-emerald-50 to-emerald-100/50 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-800 shadow-sm dark:border-emerald-500/30 dark:from-emerald-950/40 dark:to-emerald-900/20 dark:text-emerald-300">
                                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
                                              {skill}
                                            </motion.span>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {candidateSkillEvidence.length > 0 && (
                                      <div>
                                        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-cyan-600/80 dark:text-cyan-400/80">Contextual Evidence</p>
                                        <div className="space-y-2 relative before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-cyan-300/50 before:to-transparent dark:before:from-cyan-600/50">
                                          {candidateSkillEvidence.slice(0, 3).map((item, i) => (
                                            <motion.div 
                                              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.05 }}
                                              key={`${item.skill}-${item.evidence}`} 
                                              className="relative pl-5 text-[11px]">
                                              <div className="absolute left-0 top-2.5 h-3 w-3 rounded-full border-2 border-white bg-cyan-400 shadow-sm dark:border-slate-900 dark:bg-cyan-500" />
                                              <div className="rounded-xl border border-white/60 bg-white/40 p-2.5 transition-colors hover:bg-white/80 dark:border-slate-700/40 dark:bg-slate-800/30 dark:hover:bg-slate-800/60">
                                                <span className="font-bold text-cyan-800 dark:text-cyan-300">{item.skill}</span> 
                                                <span className="text-slate-600 dark:text-slate-400 ml-1.5 before:content-['—'] before:mr-1.5 before:text-slate-300 dark:before:text-slate-600">{item.evidence}</span>
                                              </div>
                                            </motion.div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
	                          ) : null}
	                          <details className="mt-2 rounded-lg border border-slate-200 bg-white p-2 dark:border-white/10 dark:bg-slate-900">
	                            <summary className="cursor-pointer font-semibold">CV Preview</summary>
                            <p className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap text-[11px] text-slate-600 dark:text-white/70">
                              {latestCandidateApplication?.resume?.preview || 'No CV preview available.'}
                            </p>
                          </details>
                        </div>
                        <button type="button" className="btn-secondary self-start" onClick={() => runCandidateModelRecheck('resume')} disabled={Boolean(candidateRecheckBusy)}>
                          {candidateRecheckBusy === 'resume' ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : null}
	                          Run M1
	                        </button>
	                      </div>
	                    </CandidateModelTile>

                    <CandidateModelTile
                      title="Match"
                      Icon={BarChart3}
                      tone="emerald"
                      score={formatScore(candidateMatchingScore)}
                      status="M2"
                      expanded={expandedCandidateModel === 'matching'}
                      onToggle={() => setExpandedCandidateModel(expandedCandidateModel === 'matching' ? '' : 'matching')}
                    >
                      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                        <div className="space-y-1">
                          <p>Fit: {formatScore(candidateMatchingScore)} ({candidateMatchingEval?.fit_band || candidateMatchingEval?.details?.match_band || 'N/A'})</p>
                          <ProgressLine value={candidateMatchingScore} tone="emerald" />
                          <p>Match score: {formatScore(candidateMatchingEval?.details?.score_0_100 || candidateMatchingScore)}</p>
                        </div>
                        <button type="button" className="btn-secondary self-start" onClick={() => runCandidateModelRecheck('matching')} disabled={Boolean(candidateRecheckBusy)}>
                          {candidateRecheckBusy === 'matching' ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : null}
                          Run M2
                        </button>
                      </div>
                    </CandidateModelTile>

                    <CandidateModelTile
                      title="Interview"
                      Icon={Mic}
                      tone="amber"
                      score={formatScore(candidateInterviewFinalScore)}
                      status="M3"
                      expanded={expandedCandidateModel === 'interview'}
                      onToggle={() => setExpandedCandidateModel(expandedCandidateModel === 'interview' ? '' : 'interview')}
                    >
                      <div className="space-y-3">
                        <div className={`rounded-xl border p-3 ${scoreBandClass(candidateInterviewFinalScore)}`}>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.08em]">Final Mark</p>
                          <p className="mt-1 text-2xl font-semibold">{formatScore(candidateInterviewFinalScore)} / 100</p>
                          <p className="mt-1 text-xs">
                            {currentCandidateInterviewHistory.length} scored answer{currentCandidateInterviewHistory.length === 1 ? '' : 's'}
                          </p>
                        </div>

                        <div className="grid gap-3 lg:grid-cols-2">
                          <label className="text-xs font-medium text-slate-700 dark:text-white/85">
                            HR Question
                            <textarea
                              value={candidateInterviewQuestion || questionText}
                              onChange={(event) => setCandidateInterviewQuestion(event.target.value)}
                              className={`${fieldBaseClass} min-h-24 resize-y`}
                              placeholder="Record or type the interview question..."
                            />
                          </label>
                          <label className="text-xs font-medium text-slate-700 dark:text-white/85">
                            Candidate Answer
                            <textarea
                              value={candidateInterviewAnswer || answerText}
                              onChange={(event) => setCandidateInterviewAnswer(event.target.value)}
                              className={`${fieldBaseClass} min-h-24 resize-y`}
                              placeholder="Record or type the candidate answer..."
                            />
                          </label>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className={recordingTarget === 'question' ? 'btn-secondary border-rose-300 text-rose-700 dark:text-rose-100' : 'btn-secondary'}
                            onClick={() => {
                              if (recordingTarget === 'question') {
                                stopRecording()
                                return
                              }
                              setCandidateInterviewQuestion('')
                              startRecording('question')
                            }}
                          >
                            {recordingTarget === 'question' ? <Square className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                            {recordingTarget === 'question' ? 'Stop Question' : 'Record Question'}
                          </button>
                          <button
                            type="button"
                            className={recordingTarget === 'answer' ? 'btn-secondary border-rose-300 text-rose-700 dark:text-rose-100' : 'btn-secondary'}
                            onClick={() => {
                              if (recordingTarget === 'answer') {
                                stopRecording()
                                return
                              }
                              setCandidateInterviewAnswer('')
                              startRecording('answer')
                            }}
                          >
                            {recordingTarget === 'answer' ? <Square className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                            {recordingTarget === 'answer' ? 'Stop Answer' : 'Record Answer'}
                          </button>
                          <button
                            type="button"
                            className="btn-primary"
                            onClick={() => runCandidateModelRecheck('interview')}
                            disabled={Boolean(candidateRecheckBusy) || !(candidateInterviewAnswer.trim() || answerText.trim())}
                          >
                            {candidateRecheckBusy === 'interview' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4" />}
                            Score Interview
                          </button>
                        </div>
                        {speechMessage ? (
                          <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-white/75">
                            {speechMessage}
                          </p>
                        ) : null}
	                        <div className="space-y-1">
	                          <p>Score: {formatScore(candidateInterviewEval?.overall_score_0_100)} | Band: {candidateInterviewEval?.band || 'N/A'}</p>
	                          <ProgressLine value={candidateInterviewScore} tone="amber" />
	                          <p>Hire: {formatScore(candidateInterviewEval?.hire_recommendation_score_0_10, 1)}/10 | Confidence: {formatScore(candidateInterviewEval?.confidence)}%</p>
	                          <p>{candidateInterviewEval?.summary || 'No interview evaluation yet.'}</p>
	                        </div>

	                        <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900">
	                          <div className="flex flex-wrap items-center justify-between gap-2">
	                            <div>
	                              <p className="font-semibold text-slate-900 dark:text-white">Credential Validation</p>
	                              <p className="mt-1 text-[11px] text-slate-500 dark:text-white/55">
	                                Interview-stage trust check for degree and certificate evidence.
	                              </p>
	                            </div>
	                            <button type="button" className="btn-secondary" onClick={() => runCandidateModelRecheck('credentials')} disabled={Boolean(candidateRecheckBusy)}>
	                              {candidateRecheckBusy === 'credentials' ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
	                              Validate Credentials
	                            </button>
	                          </div>
	                          <div className="mt-3 grid gap-2 sm:grid-cols-3">
	                            <div className={`rounded-lg border px-3 py-2 ${scoreBandClass(candidateCredentialEval?.credential_trust_score_0_100 || 0)}`}>
	                              <p className="text-[10px] font-semibold uppercase">Trust</p>
	                              <p className="mt-1 text-lg font-semibold">{formatScore(candidateCredentialEval?.credential_trust_score_0_100)}</p>
	                            </div>
	                            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-slate-950/70">
	                              <p className="text-[10px] font-semibold uppercase text-slate-500 dark:text-white/45">Degrees</p>
	                              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{(candidateCredentialEval?.degrees || []).length}</p>
	                            </div>
	                            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-slate-950/70">
	                              <p className="text-[10px] font-semibold uppercase text-slate-500 dark:text-white/45">Certificates</p>
	                              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{(candidateCredentialEval?.certifications || []).length}</p>
	                            </div>
	                          </div>
	                          <div className="mt-2 space-y-1">
	                            <p>Band: {candidateCredentialEval?.credential_trust_band || 'N/A'}</p>
	                            <p>Degrees: {(candidateCredentialEval?.degrees || []).map((item) => item.name).join(', ') || 'None detected'}</p>
	                            <p>Certificates: {(candidateCredentialEval?.certifications || []).map((item) => item.name).join(', ') || 'None detected'}</p>
	                            {candidateCredentialEval?.flags?.length ? (
	                              <p className="text-amber-700 dark:text-amber-100">{candidateCredentialEval.flags[0]}</p>
	                            ) : null}
	                          </div>
	                        </div>

	                        <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-semibold text-slate-900 dark:text-white">Interview History</p>
                            {currentCandidateInterviewHistory.length > 0 ? (
                              <button
                                type="button"
                                className="btn-secondary"
                                onClick={() =>
                                  setCandidateInterviewHistory((prev) => ({
                                    ...prev,
                                    [latestCandidateApplication.application_id]: [],
                                  }))
                                }
                              >
                                Clear History
                              </button>
                            ) : null}
                          </div>
                          <div className="mt-3 max-h-72 space-y-3 overflow-y-auto pr-1">
                            {currentCandidateInterviewHistory.length === 0 ? (
                              <p className="text-xs text-slate-500 dark:text-white/60">No scored answers yet.</p>
                            ) : (
                              currentCandidateInterviewHistory.map((item, index) => {
                                const score = Number(item.evaluation?.overall_score_0_100 || 0)
                                return (
                                  <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-950/70">
                                    <div className="flex items-start justify-between gap-2">
                                      <p className="text-xs font-semibold text-slate-500 dark:text-white/60">Q{index + 1}</p>
                                      <span className={`status-pill ${scoreBandClass(score)}`}>{formatScore(score)}</span>
                                    </div>
                                    <p className="mt-2 line-clamp-2 text-xs font-medium text-slate-800 dark:text-white/85">{item.question}</p>
                                    <p className="mt-2 line-clamp-3 text-xs text-slate-600 dark:text-white/65">{item.answer}</p>
                                    <p className="mt-2 text-[11px] text-slate-500 dark:text-white/55">
                                      {item.evaluation?.predicted_label} | {item.evaluation?.band} | Hire {formatScore(item.evaluation?.hire_recommendation_score_0_10, 1)}/10
                                    </p>
                                  </div>
                                )
                              })
                            )}
                          </div>
                        </div>
                      </div>
                    </CandidateModelTile>

                    <CandidateModelTile
                      title="Risk"
                      Icon={ShieldCheck}
                      tone="rose"
                      score={formatScore(candidateRiskScore)}
                      status="M4"
                      expanded={expandedCandidateModel === 'risk'}
                      onToggle={() => setExpandedCandidateModel(expandedCandidateModel === 'risk' ? '' : 'risk')}
                    >
                      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                        <div className="space-y-1">
                          <p>Risk Band: {candidateRiskEval?.risk_band || 'N/A'}</p>
                          <p>Attrition Score: {formatScore(candidateRiskEval?.attrition_risk_score_0_100)}</p>
                          <ProgressLine value={candidateRiskScore} tone="rose" />
                          <p>Probability: {formatScore(Number(candidateRiskEval?.attrition_probability || 0) * 100)}%</p>
                        </div>
                        <button type="button" className="btn-secondary self-start" onClick={() => runCandidateModelRecheck('risk')} disabled={Boolean(candidateRecheckBusy)}>
                          {candidateRecheckBusy === 'risk' ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : null}
                          Run M4
                        </button>
                      </div>
                    </CandidateModelTile>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950/70">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Manual Actions</h4>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {['Shortlisted', 'Interviewed', 'Selected', 'Rejected'].map((status) => (
                      <button
                        key={status}
                        type="button"
                        disabled={Boolean(inlineStatusBusy)}
                        className={`btn-secondary ${selectedApplication.status === status ? 'border-cyan-300 text-cyan-800 dark:text-cyan-100' : ''}`}
                        onClick={() => updateInlineCandidateStatus(selectedApplication.application_id, status)}
                      >
                        {inlineStatusBusy === status ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : null}
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )
    }

    if (activeSection === 'post-jobs') {
      return (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="surface-card p-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Post a Job</h2>
            <p className="mt-1 text-xs text-slate-600 dark:text-white/65">
              Add the core role details candidates expect to see before applying.
            </p>
          {postMessage ? <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-200">{postMessage}</p> : null}
          <form className="mt-3 grid gap-3" onSubmit={handlePostJob}>
            <label className="text-sm font-medium text-slate-700 dark:text-white/85">
              Job Name
              <input
                type="text"
                value={jobName}
                onChange={(event) => setJobName(event.target.value)}
                className={fieldBaseClass}
                placeholder="Frontend Developer"
              />
            </label>
            <label className="text-sm font-medium text-slate-700 dark:text-white/85">
              Required Skills
              <input
                type="text"
                value={requiredSkills}
                onChange={(event) => setRequiredSkills(event.target.value)}
                className={fieldBaseClass}
                placeholder="React, TypeScript, CSS"
              />
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm font-medium text-slate-700 dark:text-white/85">
                Experience Required
                <input
                  type="text"
                  value={jobExperience}
                  onChange={(event) => setJobExperience(event.target.value)}
                  className={fieldBaseClass}
                  placeholder="2+ years"
                />
              </label>
              <label className="text-sm font-medium text-slate-700 dark:text-white/85">
                Work Type
                <select
                  value={jobWorkType}
                  onChange={(event) => setJobWorkType(event.target.value)}
                  className={fieldBaseClass}
                >
                  <option value="hybrid">Hybrid</option>
                  <option value="remote">Remote</option>
                  <option value="onsite">Onsite</option>
                </select>
              </label>
            </div>
            <label className="text-sm font-medium text-slate-700 dark:text-white/85">
              Location
              <input
                type="text"
                value={jobLocation}
                onChange={(event) => setJobLocation(event.target.value)}
                className={fieldBaseClass}
                placeholder="Colombo, Sri Lanka"
              />
            </label>
            <label className="text-sm font-medium text-slate-700 dark:text-white/85">
              Small Job Description
              <textarea
                value={jobDescription}
                onChange={(event) => setJobDescription(event.target.value)}
                className={`${fieldBaseClass} min-h-28 resize-y`}
                placeholder="Describe the work, team, and main responsibilities..."
              />
            </label>
            <label className="text-sm font-medium text-slate-700 dark:text-white/85">
              Job Image URL
              <input
                type="url"
                value={jobImageUrl}
                onChange={(event) => setJobImageUrl(event.target.value)}
                className={fieldBaseClass}
                placeholder="https://images.pexels.com/..."
              />
            </label>
            <button type="submit" className="btn-primary" disabled={posting}>
              {posting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
              {posting ? 'Posting...' : 'Post Job'}
            </button>
          </form>
          </div>

          <div className="surface-card overflow-hidden">
            <div className="h-44 bg-slate-100 dark:bg-slate-800">
              {jobImageUrl ? (
                <img src={jobImageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-400">
                  <BriefcaseBusiness className="h-10 w-10" />
                </div>
              )}
            </div>
            <div className="p-4">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{jobName || 'Job title preview'}</p>
              <p className="mt-1 text-xs text-slate-600 dark:text-white/65">
                {jobExperience || 'Experience TBD'} | {jobWorkType} | {jobLocation || 'Location TBD'}
              </p>
              <p className="mt-3 text-xs text-slate-600 dark:text-white/70">
                {jobDescription || 'A short job description will appear here.'}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {requiredSkills.split(',').map((skill) => skill.trim()).filter(Boolean).slice(0, 6).map((skill) => (
                  <span key={skill} className="status-pill">{skill}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )
    }

    if (activeSection === 'interviews') {
      const finalScore =
        interviewScores.length > 0
          ? interviewScores.reduce(
              (total, item) => total + Number(item.evaluation?.overall_score_0_100 || 0),
              0,
            ) / interviewScores.length
          : 0
      const isRecording = Boolean(recordingTarget)
      const primaryLabel = isRecording
        ? 'Stop Recording'
        : interviewPhase === 'question'
          ? questionText.trim()
            ? 'Next: Answer'
            : 'Record Question'
          : answerText.trim()
            ? 'Score Answer'
            : 'Record Answer'

      return (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="surface-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Live Interview Mode</h2>
                <p className="mt-1 text-xs text-slate-600 dark:text-white/65">
                  Record each HR question, move to candidate answer, then score the pair with the interview model.
                </p>
              </div>
              <span className="status-pill">
                {interviewPhase === 'question' ? 'Question Step' : 'Answer Step'}
              </span>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <label className="text-sm font-medium text-slate-700 dark:text-white/85">
                HR Question
                <textarea
                  value={questionText}
                  onChange={(event) => setQuestionText(event.target.value)}
                  className={`${fieldBaseClass} min-h-36 resize-y`}
                  placeholder="Record or type the interview question..."
                />
              </label>
              <label className="text-sm font-medium text-slate-700 dark:text-white/85">
                Candidate Answer
                <textarea
                  value={answerText}
                  onChange={(event) => setAnswerText(event.target.value)}
                  className={`${fieldBaseClass} min-h-36 resize-y`}
                  placeholder="Record or type the candidate answer..."
                />
              </label>
            </div>

            {speechMessage ? (
              <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-white/10 dark:bg-slate-950 dark:text-white/75">
                {speechMessage}
              </p>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className={isRecording ? 'btn-secondary border-rose-300 text-rose-700 dark:text-rose-100' : 'btn-primary'}
                onClick={handleInterviewPrimaryAction}
                disabled={evaluatingInterview}
              >
                {evaluatingInterview ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : isRecording ? (
                  <Square className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
                {evaluatingInterview ? 'Scoring...' : primaryLabel}
              </button>

              {interviewPhase === 'answer' && !recordingTarget ? (
                <button type="button" className="btn-secondary" onClick={() => startRecording('answer')} disabled={evaluatingInterview}>
                  <Mic className="h-3.5 w-3.5" />
                  Re-record Answer
                </button>
              ) : null}

              {interviewPhase === 'question' && questionText.trim() && !recordingTarget ? (
                <button type="button" className="btn-secondary" onClick={() => startRecording('question')} disabled={evaluatingInterview}>
                  <Mic className="h-3.5 w-3.5" />
                  Re-record Question
                </button>
              ) : null}

              <button type="button" className="btn-secondary" onClick={() => setInterviewPhase('question')} disabled={evaluatingInterview || isRecording}>
                <StepForward className="h-3.5 w-3.5 rotate-180" />
                Back to Question
              </button>
              <button type="button" className="btn-secondary" onClick={handleResetInterview} disabled={evaluatingInterview}>
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Interview
              </button>
            </div>
          </div>

          <div className="surface-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Interview Scores</h2>
                <p className="mt-1 text-xs text-slate-600 dark:text-white/65">Final mark updates after each scored answer.</p>
              </div>
              <ClipboardList className="h-5 w-5 text-cyan-700 dark:text-cyan-200" />
            </div>

            <div className={`mt-4 rounded-xl border p-4 ${scoreBandClass(finalScore)}`}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em]">Final Mark</p>
              <p className="mt-1 text-3xl font-semibold">{finalScore.toFixed(1)} / 100</p>
              <p className="mt-1 text-xs">{interviewScores.length} scored question-answer pair{interviewScores.length === 1 ? '' : 's'}</p>
            </div>

            <div className="mt-4 max-h-[520px] space-y-3 overflow-y-auto pr-1">
              {interviewScores.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-white/60">No scored answers yet.</p>
              ) : (
                interviewScores.map((item, index) => {
                  const score = Number(item.evaluation?.overall_score_0_100 || 0)
                  return (
                    <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950/70">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-500 dark:text-white/60">Q{index + 1}</p>
                        <span className={`status-pill ${scoreBandClass(score)}`}>{score.toFixed(1)}</span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs font-medium text-slate-800 dark:text-white/85">{item.question}</p>
                      <p className="mt-2 line-clamp-3 text-xs text-slate-600 dark:text-white/65">{item.answer}</p>
                      <p className="mt-2 text-[11px] text-slate-500 dark:text-white/55">
                        {item.evaluation?.predicted_label} | {item.evaluation?.band} | Hire {Number(item.evaluation?.hire_recommendation_score_0_10 || 0).toFixed(1)}/10
                      </p>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {[
            { label: 'Candidates', value: candidateAnalytics.total, tone: 'slate' },
            { label: 'Shortlisted', value: candidateAnalytics.statusCounts.shortlisted, tone: 'amber' },
            { label: 'Interviewed', value: candidateAnalytics.statusCounts.interviewed, tone: 'cyan' },
            { label: 'Selected', value: candidateAnalytics.statusCounts.selected, tone: 'emerald' },
            { label: 'Avg Match', value: formatScore(candidateAnalytics.averageFit), tone: 'emerald' },
            { label: 'Avg Interview', value: formatScore(candidateAnalytics.averageInterview), tone: 'amber' },
          ].map((item) => (
            <div key={item.label} className="surface-card p-4">
              <p className="text-[11px] font-semibold uppercase text-slate-500 dark:text-white/55">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="surface-card p-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Candidate Pipeline</h2>
            <div className="mt-4 space-y-3">
              {[
                ['Applied', candidateAnalytics.statusCounts.applied, 'cyan'],
                ['Shortlisted', candidateAnalytics.statusCounts.shortlisted, 'amber'],
                ['Interviewed', candidateAnalytics.statusCounts.interviewed, 'cyan'],
                ['Selected', candidateAnalytics.statusCounts.selected, 'emerald'],
                ['Rejected', candidateAnalytics.statusCounts.rejected, 'rose'],
              ].map(([label, count, tone]) => (
                <div key={label}>
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-600 dark:text-white/70">
                    <span>{label}</span>
                    <span>{count}</span>
                  </div>
                  <ProgressLine value={candidateAnalytics.total ? (Number(count) / candidateAnalytics.total) * 100 : 0} tone={tone} />
                </div>
              ))}
            </div>
          </div>

          <div className="surface-card p-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Interview Coverage</h2>
            <div className={`mt-4 rounded-xl border p-4 ${scoreBandClass(candidateAnalytics.averageInterview)}`}>
              <p className="text-[11px] font-semibold uppercase">Average Interview</p>
              <p className="mt-1 text-3xl font-semibold">{formatScore(candidateAnalytics.averageInterview)}</p>
              <p className="mt-1 text-xs">{candidateAnalytics.interviewCount} candidates have interview scores</p>
            </div>
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-950/70">
              <p className="text-xs font-semibold text-slate-700 dark:text-white/80">Manual scored answers</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
                {candidateAnalytics.candidateInterviewHistoryCount}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="surface-card p-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Matching Distribution</h2>
            <div className="mt-4 space-y-3">
              {[
                ['High Match', candidateAnalytics.matchingBands.high, 'emerald'],
                ['Medium Match', candidateAnalytics.matchingBands.medium, 'amber'],
                ['Low Match', candidateAnalytics.matchingBands.low, 'rose'],
              ].map(([label, count, tone]) => (
                <div key={label}>
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-600 dark:text-white/70">
                    <span>{label}</span>
                    <span>{count}</span>
                  </div>
                  <ProgressLine value={candidateAnalytics.total ? (Number(count) / candidateAnalytics.total) * 100 : 0} tone={tone} />
                </div>
              ))}
            </div>
          </div>

          <div className="surface-card p-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Risk Breakdown</h2>
            <div className="mt-3">
              <RiskChart distribution={dashboard?.risk_distribution || {}} />
            </div>
            <p className="mt-3 text-xs text-slate-600 dark:text-white/65">
              High-risk candidates: {candidateAnalytics.highRisk}
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="surface-card p-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Applied Jobs</h3>
            <div className="mt-3 space-y-2">
              {candidateAnalytics.topJobs.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-white/60">No job application data yet.</p>
              ) : (
                candidateAnalytics.topJobs.map((job) => (
                  <button
                    key={job.jobId}
                    type="button"
                    className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left transition hover:border-cyan-300 dark:border-white/10 dark:bg-slate-950/70"
                    onClick={() => {
                      setCandidateJobFilter(job.jobId)
                      setSelectedApplicationId('')
                      navigate('/hr/candidates')
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">{job.name}</span>
                      <span className="status-pill">{job.count}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="surface-card p-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Top Skills in Pipeline</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {(dashboard?.top_skills || []).length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-white/60">No skill trend data yet.</p>
              ) : (
                (dashboard.top_skills || []).map((skill) => (
                  <span key={`${skill.skill}-${skill.count}`} className="status-pill">
                    {skill.skill}: {skill.count}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <WorkspaceShell
      mode={mode}
      title="HR Dashboard"
      subtitle="Manage jobs, candidates, and analytics"
      navItems={HR_MENU}
      activeItemKey={activeSection}
      onSelectItem={(nextKey) => navigate(`/hr/${nextKey}`)}
      onLogout={() => {
        logout('hr')
        navigate('/hr', { replace: true })
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
          <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-white/75">
            <ShieldCheck className="h-3.5 w-3.5" />
            Demo HR login: {DEMO_CREDENTIALS.hr.email} / {DEMO_CREDENTIALS.hr.password}
          </div>
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
