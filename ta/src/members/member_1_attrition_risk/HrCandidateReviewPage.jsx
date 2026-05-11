import { motion } from 'framer-motion'
import {
  ArrowLeft,
  BarChart3,
  BriefcaseBusiness,
  BrainCircuit,
  ChevronDown,
  CheckCircle2,
  FileText,
  LayoutDashboard,
  LoaderCircle,
  Mic,
  PlusCircle,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UserRound,
  Users,
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { hrStatusClasses, requestWithHrAuth } from '../../shared/utils/hrWorkspaceApi'

const fieldBaseClass =
  'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200/70 dark:border-white/10 dark:bg-slate-900 dark:text-white dark:focus:border-cyan-300 dark:focus:ring-cyan-400/25'

const HR_REVIEW_NAV = [
  { to: '/hr/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/hr/jobs', label: 'Jobs', icon: BriefcaseBusiness },
  { to: '/hr/candidates', label: 'Candidates', icon: Users },
  { to: '/hr/interviews', label: 'Interviews', icon: Mic },
  { to: '/hr/post-jobs', label: 'Post Jobs', icon: PlusCircle },
  { to: '/hr/analytics', label: 'Analytics', icon: BarChart3 },
]

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

function scoreBandClass(value) {
  const score = Number(value || 0)
  if (score >= 75) {
    return 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-300/35 dark:bg-emerald-400/15 dark:text-emerald-100'
  }
  if (score >= 55) {
    return 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-300/35 dark:bg-amber-400/15 dark:text-amber-100'
  }
  return 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-300/35 dark:bg-rose-400/15 dark:text-rose-100'
}

function compactList(values, fallback = 'N/A') {
  const list = Array.isArray(values) ? values.filter(Boolean) : []
  return list.length > 0 ? list.join(', ') : fallback
}

function formatScore(value, decimals = 1) {
  const score = Number(value || 0)
  return Number.isFinite(score) ? score.toFixed(decimals) : Number(0).toFixed(decimals)
}

function DetailItem({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-slate-950/70">
      <p className="text-[11px] font-semibold uppercase text-slate-500 dark:text-white/45">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-slate-900 dark:text-white">{value || 'N/A'}</p>
    </div>
  )
}

function MetricCard({ label, value, subtext, tone = 'slate' }) {
  const toneClass = {
    cyan: 'border-cyan-200 bg-cyan-50 text-cyan-900 dark:border-cyan-300/25 dark:bg-cyan-400/10 dark:text-cyan-100',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-300/25 dark:bg-emerald-400/10 dark:text-emerald-100',
    amber: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-300/25 dark:bg-amber-400/10 dark:text-amber-100',
    rose: 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-300/25 dark:bg-rose-400/10 dark:text-rose-100',
    slate: 'border-slate-200 bg-white text-slate-900 dark:border-white/10 dark:bg-slate-950/70 dark:text-white',
  }[tone]

  return (
    <div className={`rounded-lg border px-3 py-2 ${toneClass}`}>
      <p className="text-[11px] font-semibold uppercase opacity-65">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
      {subtext ? <p className="mt-1 text-[11px] opacity-70">{subtext}</p> : null}
    </div>
  )
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
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className={`h-full rounded-full bg-gradient-to-r ${colorClass}`}
      />
    </div>
  )
}

function HrIconSidebar() {
  return (
    <aside className="sticky top-[61px] h-[calc(100vh-61px)] w-16 shrink-0 border-r border-slate-200 bg-white/80 px-2 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80">
      <div className="flex h-full flex-col items-center gap-2">
        <span className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-emerald-400 text-slate-950">
          <BriefcaseBusiness className="h-4 w-4" />
        </span>
        {HR_REVIEW_NAV.map((item) => {
          const isActive = item.to === '/hr/candidates'
          return (
            <Link
              key={item.to}
              to={item.to}
              title={item.label}
              aria-label={item.label}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition ${
                isActive
                  ? 'border-cyan-300 bg-cyan-50 text-cyan-800 shadow-sm dark:border-cyan-300/35 dark:bg-cyan-400/15 dark:text-cyan-100'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:text-cyan-700 dark:border-white/10 dark:bg-slate-900 dark:text-white/70 dark:hover:border-cyan-300/30 dark:hover:text-cyan-100'
              }`}
            >
              <item.icon className="h-4 w-4" />
            </Link>
          )
        })}
      </div>
    </aside>
  )
}

function ModelDrawerCard({
  title,
  Icon,
  tone = 'slate',
  score,
  status,
  summary,
  expanded = false,
  onToggle,
  children,
}) {
  const toneClass = {
    cyan: 'border-cyan-200 bg-cyan-50/80 dark:border-cyan-300/25 dark:bg-cyan-400/10',
    emerald: 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-300/25 dark:bg-emerald-400/10',
    amber: 'border-amber-200 bg-amber-50/80 dark:border-amber-300/25 dark:bg-amber-400/10',
    rose: 'border-rose-200 bg-rose-50/80 dark:border-rose-300/25 dark:bg-rose-400/10',
    slate: 'border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950/70',
  }[tone]

  return (
    <motion.div
      layout
      className={`rounded-xl border ${toneClass} ${expanded ? 'md:col-span-2 xl:col-span-4' : ''}`}
    >
      <button
        type="button"
        onClick={onToggle}
        className={`w-full p-3 text-left ${expanded ? 'grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3' : 'flex min-h-32 flex-col items-center justify-center gap-2 text-center'}`}
      >
        <span className={`${expanded ? 'h-9 w-9' : 'h-12 w-12'} inline-flex items-center justify-center rounded-xl border border-white/60 bg-white/75 text-slate-800 shadow-sm dark:border-white/10 dark:bg-slate-950/60 dark:text-white`}>
          <Icon className={expanded ? 'h-4 w-4' : 'h-5 w-5'} />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">{title}</span>
          {expanded ? (
            <span className="mt-1 block truncate text-[11px] text-slate-600 dark:text-white/65">{summary}</span>
          ) : null}
        </span>
        <span className={`flex items-center gap-2 ${expanded ? '' : 'justify-center'}`}>
          {score !== undefined ? <span className={expanded ? 'text-sm font-semibold text-slate-900 dark:text-white' : 'text-xl font-semibold text-slate-900 dark:text-white'}>{score}</span> : null}
          {status ? <span className={`${expanded ? 'hidden sm:inline-flex' : 'inline-flex'} status-pill`}>{status}</span> : null}
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

export default function HrCandidateReviewPage() {
  const { applicationId } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [applications, setApplications] = useState([])
  const [selectedId, setSelectedId] = useState(applicationId || '')
  const [statusSelection, setStatusSelection] = useState('Shortlisted')
  const [statusBusy, setStatusBusy] = useState(false)
  const [recheckBusy, setRecheckBusy] = useState(false)
  const [recheckResult, setRecheckResult] = useState(null)
  const [interviewAnswer, setInterviewAnswer] = useState('')
  const [interviewQuestion, setInterviewQuestion] = useState('')
  const [expandedModel, setExpandedModel] = useState('matching')
  const [selectedRecheckModels, setSelectedRecheckModels] = useState({
    resume: true,
    matching: true,
    risk: true,
  })

  const selectedApplication = useMemo(
    () => applications.find((item) => item.application_id === selectedId) || null,
    [applications, selectedId],
  )

  useEffect(() => {
    setSelectedId(applicationId || '')
  }, [applicationId])

  useEffect(() => {
    const currentStatus = String(selectedApplication?.status || '')
    if (['Shortlisted', 'Interviewed', 'Selected', 'Rejected'].includes(currentStatus)) {
      setStatusSelection(currentStatus)
      return
    }
    setStatusSelection('Shortlisted')
  }, [selectedApplication?.application_id, selectedApplication?.status])

  const loadApplications = useCallback(async (preferredId = '') => {
    setLoading(true)
    setErrorMessage('')
    try {
      const payload = await requestWithHrAuth('/api/v1/recruiter/applications')
      const items = Array.isArray(payload) ? payload : []
      setApplications(items)

      const validId =
        (preferredId && items.some((item) => item.application_id === preferredId) && preferredId) ||
        (applicationId && items.some((item) => item.application_id === applicationId) && applicationId) ||
        items[0]?.application_id ||
        ''

      setSelectedId(validId)
      if (validId && validId !== applicationId) {
        navigate(`/hr/candidates/${validId}`, { replace: true })
      }
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setLoading(false)
    }
  }, [applicationId, navigate])

  useEffect(() => {
    loadApplications(applicationId || '')
  }, [applicationId, loadApplications])

  function chooseCandidate(nextId) {
    setSelectedId(nextId)
    setRecheckResult(null)
    navigate(`/hr/candidates/${nextId}`)
  }

  function toggleRecheckModel(modelKey) {
    setSelectedRecheckModels((prev) => ({
      ...prev,
      [modelKey]: !prev[modelKey],
    }))
  }

  function runSelectedRecheckModels() {
    const selectedModels = Object.entries(selectedRecheckModels)
      .filter(([, selected]) => selected)
      .map(([modelKey]) => modelKey)

    if (selectedModels.length === 0) {
      setErrorMessage('Select at least one model to recheck.')
      return
    }

    runManualRecheck(selectedModels)
  }

  async function runManualRecheck(requestedModels) {
    if (!selectedId) {
      setErrorMessage('Select a candidate first.')
      return
    }

    setRecheckBusy(true)
    setErrorMessage('')
    try {
      const body = {
        requested_models: requestedModels,
        persist_results: true,
      }
      if (requestedModels.includes('interview')) {
        if (!interviewAnswer.trim()) {
          setErrorMessage('Type the candidate interview answer before manually scoring Model 3.')
          return
        }
        body.interview_answer = interviewAnswer.trim()
        if (interviewQuestion.trim()) {
          body.interview_question = interviewQuestion.trim()
        }
      }

      const payload = await requestWithHrAuth(`/api/v1/recruiter/applications/${selectedId}/recheck`, {
        method: 'POST',
        body,
      })

      setRecheckResult(payload || null)
      const updated = payload?.updated_application
      if (updated?.application_id) {
        setApplications((prev) =>
          prev.map((item) => (item.application_id === updated.application_id ? updated : item)),
        )
      }
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setRecheckBusy(false)
    }
  }

  async function updateCandidateStatus() {
    if (!selectedId) {
      setErrorMessage('Select a candidate first.')
      return
    }

    setStatusBusy(true)
    setErrorMessage('')
    try {
      const payload = await requestWithHrAuth(`/api/v1/applications/${selectedId}/status`, {
        method: 'PATCH',
        body: {
          status: statusSelection,
          note: `Manual HR status update: ${statusSelection}`,
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
      setStatusBusy(false)
    }
  }

  const latestApplication = recheckResult?.updated_application || selectedApplication
  const resumeProfile = recheckResult?.model_1_resume_parsing || latestApplication?.resume
  const credentialEval = recheckResult?.model_1b_credential_validation || latestApplication?.ai_scores?.credentials
  const resumeXai = resumeProfile?.explainable_ai || {}
  const resumeStats = resumeXai?.extraction_stats || {}
  const skillEvidence = resumeXai?.skill_evidence || []
  const resumeStatItems = [
    ['Words', resumeStats.word_count],
    ['Lines', resumeStats.line_count],
    ['Skills', resumeStats.skill_count],
    ['Sections', resumeStats.detected_section_count],
    ['Skill Density', resumeStats.skill_density_per_100_words != null ? `${formatScore(resumeStats.skill_density_per_100_words, 2)} / 100 words` : null],
    ['Required Coverage', resumeStats.required_skill_coverage_0_100 != null ? `${formatScore(resumeStats.required_skill_coverage_0_100)}%` : null],
    ['Completeness', resumeStats.completeness_score_0_100 != null ? `${formatScore(resumeStats.completeness_score_0_100)}%` : null],
  ].filter(([, value]) => value !== null && value !== undefined && value !== '')
  const sectionSignals = Object.entries(resumeXai?.section_signals || {}).filter(([, value]) => Number(value) > 0)
  const inferredFields = resumeProfile?.feature_inference?.inferred_fields || []
  const requiredSkillMatches = resumeXai?.matched_required_skills || []
  const trainedResumeLabels = resumeXai?.trained_model?.label_scores || []
  const matchingEval = recheckResult?.model_2_job_matching || {
    summary: latestApplication?.ai_scores?.matching_summary,
    details: latestApplication?.ai_scores?.matching,
    fit_score_0_100: latestApplication?.ai_scores?.fit_score_0_100,
    fit_band: latestApplication?.ai_scores?.fit_band,
  }
  const interviewEval = recheckResult?.model_3_interview_evaluation || latestApplication?.ai_scores?.interview
  const riskEval = recheckResult?.model_4_attrition_risk || latestApplication?.ai_scores?.risk
  const matchingScore = Number(matchingEval?.fit_score_0_100 || matchingEval?.details?.score_0_100 || 0)
  const interviewScore = Number(interviewEval?.overall_score_0_100 || 0)
  const riskScore = Number(riskEval?.attrition_risk_score_0_100 || 0)

  return (
    <main className="min-h-screen bg-slate-50/80 dark:bg-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-white/50">
              HR Candidate Review
            </p>
            <h1 className="truncate text-sm font-semibold text-slate-900 dark:text-white">
              {selectedApplication?.candidate_name || selectedApplication?.candidate_email || applicationId || 'Candidate'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/hr/candidates" className="btn-secondary">
              <ArrowLeft className="h-3.5 w-3.5" />
              Candidates
            </Link>
            <button type="button" onClick={() => loadApplications(selectedId)} className="btn-secondary" disabled={loading}>
              {loading ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Refresh
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        <HrIconSidebar />
        <section className="min-w-0 flex-1 px-3 py-4 md:px-4 lg:px-5">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/70"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="accent-chip">
                <UserRound className="h-3.5 w-3.5" />
                {latestApplication?.application_id || applicationId}
              </p>
              <h2 className="mt-3 text-xl font-semibold text-slate-900 dark:text-white">
                {latestApplication?.candidate_name || latestApplication?.candidate_email || 'Individual Candidate Evaluation'}
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-white/70">
                Minimal review desk for status decisions, selective model rechecks, and manual-only interview scoring.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/hr/dashboard" className="btn-secondary">Dashboard</Link>
              <span className="status-pill">{latestApplication?.status || 'Loading'}</span>
            </div>
          </div>

          {errorMessage ? (
            <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-300/25 dark:bg-rose-400/10 dark:text-rose-200">
              {errorMessage}
            </p>
          ) : null}
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]"
        >
            <aside className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-slate-900/70">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Queue</h2>
                <span className="status-pill">{applications.length}</span>
              </div>
              <div className="mt-3 max-h-[calc(100vh-230px)] space-y-2 overflow-auto pr-1">
                {loading ? (
                  <p className="inline-flex items-center gap-2 text-sm text-cyan-700 dark:text-cyan-200">
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Loading candidates...
                  </p>
                ) : null}

                {!loading && applications.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-white/60">No applications found.</p>
                ) : null}

                {applications.map((application) => {
                  const classes = hrStatusClasses(application.status)
                  const isActive = application.application_id === selectedId
                  return (
                    <button
                      key={application.application_id}
                      type="button"
                      onClick={() => chooseCandidate(application.application_id)}
                      className={`block w-full rounded-xl border px-3 py-3 text-left ${
                        isActive ? 'border-cyan-300 bg-cyan-50 shadow-sm dark:border-cyan-300/35 dark:bg-cyan-400/10' : 'border-slate-200 bg-slate-50 hover:border-cyan-200 dark:border-white/10 dark:bg-slate-950/60 dark:hover:border-cyan-300/30'
                      }`}
                    >
                      <p className={`truncate text-sm font-semibold ${isActive ? 'text-cyan-900 dark:text-cyan-100' : classes.title}`}>
                        {application.candidate_name || application.candidate_email}
                      </p>
                      <p className={`mt-1 text-xs ${isActive ? 'text-cyan-800/75 dark:text-cyan-100/75' : classes.text}`}>
                        {application.application_id} | {application.status}
                      </p>
                      <p className={`mt-1 text-xs ${isActive ? 'text-cyan-800/75 dark:text-cyan-100/75' : classes.text}`}>
                        Fit: {Number(application?.ai_scores?.fit_score_0_100 || 0).toFixed(1)} | Risk: {application?.ai_scores?.risk?.risk_band || 'N/A'}
                      </p>
                    </button>
                  )
                })}
              </div>
            </aside>

            <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/70">
              {!selectedApplication ? (
                <p className="text-sm text-slate-500 dark:text-white/60">Select a candidate to open the review panel.</p>
              ) : (
                <div className="space-y-4 text-xs">
                  <div className={`rounded-xl border p-4 ${hrStatusClasses(selectedApplication.status).card}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className={`text-base font-semibold ${hrStatusClasses(selectedApplication.status).title}`}>
                          {selectedApplication.candidate_name || selectedApplication.candidate_email}
                        </p>
                        <p className={`mt-1 ${hrStatusClasses(selectedApplication.status).text}`}>
                          {selectedApplication.candidate_email || 'No email'} | Candidate ID: {selectedApplication.candidate_id || 'N/A'}
                        </p>
                      </div>
                      <span className="status-pill">{selectedApplication.status}</span>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <DetailItem label="Application" value={selectedApplication.application_id} />
                      <DetailItem label="Vacancy" value={selectedApplication.vacancy_id} />
                      <DetailItem label="Resume File" value={selectedApplication?.resume?.file_name || selectedApplication?.resume?.source} />
                      <DetailItem label="Detected Skills" value={compactList(selectedApplication?.resume?.skills)} />
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricCard label="Fit Score" value={formatScore(matchingScore)} subtext={matchingEval?.fit_band || matchingEval?.details?.match_band || 'Match'} tone="emerald" />
                    <MetricCard label="Interview" value={formatScore(interviewScore)} subtext={interviewEval?.band || 'Manual score'} tone="amber" />
                    <MetricCard label="Risk" value={formatScore(riskScore)} subtext={riskEval?.risk_band || 'Attrition'} tone="rose" />
                    <MetricCard label="Decision" value={latestApplication?.ai_scores?.ai_recommendation || 'Pending'} subtext="AI recommendation" tone="cyan" />
                  </div>

                  <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950/70">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-white/90">Review Summary</p>
                          <p className="mt-1 text-slate-600 dark:text-white/70">
                            {latestApplication?.ai_scores?.ai_recommendation_reason || recheckResult?.ai_recommendation_reason || 'No recommendation explanation available.'}
                          </p>
                        </div>
                        <span className="status-pill">
                          {latestApplication?.ai_scores?.ai_recommendation || recheckResult?.ai_recommendation || 'Pending'}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button type="button" onClick={runSelectedRecheckModels} className="btn-secondary" disabled={recheckBusy}>
                          {recheckBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <SlidersHorizontal className="h-3.5 w-3.5" />}
                          Run Selected Batch
                        </button>
                        {[
                          { key: 'resume', label: 'M1' },
                          { key: 'matching', label: 'M2' },
                          { key: 'risk', label: 'M4' },
                        ].map((modelItem) => (
                          <button
                            key={modelItem.key}
                            type="button"
                            onClick={() => toggleRecheckModel(modelItem.key)}
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                              selectedRecheckModels[modelItem.key]
                                ? 'border-cyan-300 bg-cyan-50 text-cyan-900 dark:border-cyan-300/35 dark:bg-cyan-400/15 dark:text-cyan-100'
                                : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-slate-900 dark:text-white/60'
                            }`}
                          >
                            {modelItem.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950/70">
                      <p className="font-semibold text-slate-800 dark:text-white/90">Manual Candidate Status</p>
                      <div className="mt-2 grid gap-2">
                        <label className="text-xs font-medium text-slate-700 dark:text-white/85">
                          Status
                          <select
                            value={statusSelection}
                            onChange={(event) => setStatusSelection(event.target.value)}
                            className={fieldBaseClass}
                          >
                            <option value="Shortlisted">Shortlisted</option>
                            <option value="Interviewed">Interviewed</option>
                            <option value="Selected">Selected</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </label>
                        <button type="button" onClick={updateCandidateStatus} disabled={statusBusy} className="btn-secondary">
                          {statusBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                          Update Status
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950/70">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-white/90">Model Drawer</p>
                        <p className="mt-1 text-slate-600 dark:text-white/70">
                          Click a model tile to expand details and run that model.
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <ModelDrawerCard
                        title="Model 1 Resume"
                        Icon={FileText}
                        tone="cyan"
                        score={(resumeProfile?.skills_detected || resumeProfile?.skills || []).length}
                        status="Skills"
                        summary={resumeProfile?.candidate_name || selectedApplication.candidate_name || 'Resume parsing'}
                        expanded={expandedModel === 'resume'}
                        onToggle={() => setExpandedModel(expandedModel === 'resume' ? '' : 'resume')}
                      >
                        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                          <div className="space-y-1">
                            <p>Candidate: {resumeProfile?.candidate_name || selectedApplication.candidate_name || 'N/A'}</p>
                            <p>Email: {resumeProfile?.email || selectedApplication.candidate_email || 'N/A'}</p>
                            <p>Skills: {compactList(resumeProfile?.skills_detected || resumeProfile?.skills)}</p>
                            <p>Characters: {resumeProfile?.text_char_count || selectedApplication?.resume?.text_char_count || 'N/A'}</p>
                            {resumeStatItems.length ? (
                              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                {resumeStatItems.map(([label, value]) => (
                                  <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-slate-900">
                                    <p className="text-[10px] font-semibold uppercase text-slate-500 dark:text-white/45">{label}</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{value}</p>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                            {(requiredSkillMatches.length > 0 || skillEvidence.length > 0 || trainedResumeLabels.length > 0) ? (
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
                                    {trainedResumeLabels.length > 0 && (
                                      <div>
                                        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-indigo-500/80 dark:text-indigo-400/80">Classified Attributes</p>
                                        <div className="grid gap-2 sm:grid-cols-2">
                                          {trainedResumeLabels.slice(0, 4).map((item, i) => (
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

                                    {requiredSkillMatches.length > 0 && (
                                      <div>
                                        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-emerald-600/80 dark:text-emerald-400/80">Matched Requirements</p>
                                        <div className="flex flex-wrap gap-2">
                                          {requiredSkillMatches.map((skill, i) => (
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

                                    {skillEvidence.length > 0 && (
                                      <div>
                                        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-cyan-600/80 dark:text-cyan-400/80">Contextual Evidence</p>
                                        <div className="space-y-2 relative before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-cyan-300/50 before:to-transparent dark:before:from-cyan-600/50">
                                          {skillEvidence.slice(0, 3).map((item, i) => (
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
                          </div>
                          <button type="button" onClick={() => runManualRecheck(['resume'])} className="btn-secondary self-start" disabled={recheckBusy}>
                            {recheckBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                            Run Model 1
                          </button>
                        </div>
                      </ModelDrawerCard>

                      <ModelDrawerCard
                        title="Model 2 Matching"
                        Icon={BarChart3}
                        tone="emerald"
                        score={formatScore(matchingScore)}
                        status={matchingEval?.fit_band || matchingEval?.details?.match_band || 'Fit'}
                        summary={matchingEval?.summary || matchingEval?.details?.explanation || 'Job fit scoring'}
                        expanded={expandedModel === 'matching'}
                        onToggle={() => setExpandedModel(expandedModel === 'matching' ? '' : 'matching')}
                      >
                        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                          <div className="space-y-1">
                            <p>
                              Fit: <span className={scoreClass(matchingScore)}>{formatScore(matchingScore)}</span>
                              {' '}({matchingEval?.fit_band || 'N/A'})
                            </p>
                            <ProgressLine value={matchingScore} tone="emerald" />
                            <p>Match: {formatScore(matchingEval?.details?.score_0_100)} ({matchingEval?.details?.match_band || 'N/A'})</p>
                          </div>
                          <button type="button" onClick={() => runManualRecheck(['matching'])} className="btn-secondary self-start" disabled={recheckBusy}>
                            {recheckBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                            Run Model 2
                          </button>
                        </div>
                      </ModelDrawerCard>

                      <ModelDrawerCard
                        title="Model 3 Interview"
                        Icon={BrainCircuit}
                        tone="amber"
                        score={formatScore(interviewScore)}
                        status={interviewEval?.band || 'Manual'}
                        summary="Manual-only scoring from typed candidate answer"
                        expanded={expandedModel === 'interview'}
                        onToggle={() => setExpandedModel(expandedModel === 'interview' ? '' : 'interview')}
                      >
                        <div className="space-y-3">
                          <div className="grid gap-3 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                            <label className="block text-xs font-medium text-slate-700 dark:text-white/85">
                              Interview Question
                              <input
                                type="text"
                                value={interviewQuestion}
                                onChange={(event) => setInterviewQuestion(event.target.value)}
                                className={fieldBaseClass}
                                placeholder="Describe a challenging production issue..."
                              />
                            </label>
                            <label className="block text-xs font-medium text-slate-700 dark:text-white/85">
                              Candidate Answer Required
                              <textarea
                                rows={3}
                                value={interviewAnswer}
                                onChange={(event) => setInterviewAnswer(event.target.value)}
                                className={fieldBaseClass}
                                placeholder="Paste the candidate answer to score..."
                              />
                            </label>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => runManualRecheck(['interview'])}
                              className="btn-primary"
                              disabled={recheckBusy || !interviewAnswer.trim()}
                            >
                              {recheckBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4" />}
                              Score Interview
                            </button>
                            <span className="text-[11px] text-slate-500 dark:text-white/60">Manual-only. It never runs from batch actions.</span>
                          </div>
                          <div className="space-y-1">
                            <p>Score: {formatScore(interviewEval?.overall_score_0_100)} | Band: {interviewEval?.band || 'N/A'}</p>
                            <ProgressLine value={interviewScore} tone="amber" />
                            <p>Hire: {formatScore(interviewEval?.hire_recommendation_score_0_10, 1)}/10 | Confidence: {formatScore(interviewEval?.confidence)}%</p>
                            <p>{interviewEval?.summary || 'No interview evaluation yet.'}</p>
                          </div>
                          <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p className="font-semibold text-slate-900 dark:text-white">Credential Validation</p>
                                <p className="mt-1 text-[11px] text-slate-500 dark:text-white/55">Interview-stage trust check for degree and certificate evidence.</p>
                              </div>
                              <button type="button" onClick={() => runManualRecheck(['credentials'])} className="btn-secondary" disabled={recheckBusy}>
                                {recheckBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                                Validate Credentials
                              </button>
                            </div>
                            <div className="mt-3 grid gap-2 sm:grid-cols-3">
                              <div className={`rounded-lg border px-3 py-2 ${scoreBandClass(credentialEval?.credential_trust_score_0_100 || 0)}`}>
                                <p className="text-[10px] font-semibold uppercase">Trust</p>
                                <p className="mt-1 text-lg font-semibold">{formatScore(credentialEval?.credential_trust_score_0_100)}</p>
                              </div>
                              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-slate-950/70">
                                <p className="text-[10px] font-semibold uppercase text-slate-500 dark:text-white/45">Degrees</p>
                                <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{(credentialEval?.degrees || []).length}</p>
                              </div>
                              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-slate-950/70">
                                <p className="text-[10px] font-semibold uppercase text-slate-500 dark:text-white/45">Certificates</p>
                                <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{(credentialEval?.certifications || []).length}</p>
                              </div>
                            </div>
                            <div className="mt-2 space-y-1">
                              <p>Band: {credentialEval?.credential_trust_band || 'N/A'}</p>
                              <p>Degrees: {(credentialEval?.degrees || []).map((item) => item.name).join(', ') || 'None detected'}</p>
                              <p>Certificates: {(credentialEval?.certifications || []).map((item) => item.name).join(', ') || 'None detected'}</p>
                              {credentialEval?.flags?.length ? (
                                <p className="text-amber-700 dark:text-amber-100">{credentialEval.flags[0]}</p>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </ModelDrawerCard>

                      <ModelDrawerCard
                        title="Model 4 Risk"
                        Icon={ShieldAlert}
                        tone="rose"
                        score={formatScore(riskScore)}
                        status={riskEval?.risk_band || 'Risk'}
                        summary={compactList((riskEval?.top_factors || []).map((item) => `${item.name}: ${item.effect}`), 'Attrition risk scoring')}
                        expanded={expandedModel === 'risk'}
                        onToggle={() => setExpandedModel(expandedModel === 'risk' ? '' : 'risk')}
                      >
                        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                          <div className="space-y-1">
                            <p>Risk Band: {riskEval?.risk_band || 'N/A'}</p>
                            <p>Attrition Score: {formatScore(riskEval?.attrition_risk_score_0_100)}</p>
                            <ProgressLine value={riskScore} tone="rose" />
                            <p>Probability: {formatScore(Number(riskEval?.attrition_probability || 0) * 100)}%</p>
                            <p>{compactList((riskEval?.top_factors || []).map((item) => `${item.name}: ${item.effect}`))}</p>
                          </div>
                          <button type="button" onClick={() => runManualRecheck(['risk'])} className="btn-secondary self-start" disabled={recheckBusy}>
                            {recheckBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                            Run Model 4
                          </button>
                        </div>
                      </ModelDrawerCard>
                    </div>
                  </div>

                  {recheckResult ? (
                    <details className="rounded-lg border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950/70">
                      <summary className="cursor-pointer text-xs font-semibold text-slate-800 dark:text-white/90">
                        Latest Manual Recheck Output
                      </summary>
                      <pre className="mt-2 max-h-56 overflow-auto text-[11px] text-slate-700 dark:text-white/80">
                        {JSON.stringify(recheckResult, null, 2)}
                      </pre>
                    </details>
                  ) : null}

                  <details className="rounded-lg border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950/70">
                    <summary className="cursor-pointer text-xs font-semibold text-slate-800 dark:text-white/90">
                      <span className="inline-flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5" />
                        Full Candidate JSON
                      </span>
                    </summary>
                    <pre className="mt-2 max-h-56 overflow-auto text-[11px] text-slate-700 dark:text-white/80">
                      {JSON.stringify(latestApplication, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
        </motion.section>
        </section>
      </div>
    </main>
  )
}
