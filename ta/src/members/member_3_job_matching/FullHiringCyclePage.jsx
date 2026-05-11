import { motion } from 'framer-motion'
import {
  ArrowDownUp,
  BriefcaseBusiness,
  Building2,
  ClipboardList,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  UserRound,
  Users,
  Workflow,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import ModulePageLayout from '../../shared/components/ModulePageLayout'
import { useSharedCv } from '../../shared/context/SharedCvContext'
import { fadeInUp, staggerContainer } from '../../shared/utils/motion'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

const fieldBaseClass =
  'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200/70 dark:border-white/10 dark:bg-slate-900 dark:text-white dark:focus:border-cyan-300 dark:focus:ring-cyan-400/25'

const seededAccounts = [
  { label: 'Admin', email: 'admin@talentai.local', password: 'Admin123!' },
  { label: 'Recruiter', email: 'hr@talentai.local', password: 'Recruiter123!' },
  { label: 'Candidate', email: 'candidate@talentai.local', password: 'Candidate123!' },
]

const applicationStatuses = [
  'Applied',
  'Under Review',
  'Shortlisted',
  'Interview Scheduled',
  'Interviewed',
  'Final Review',
  'Selected',
  'Rejected',
  'Talent Pool',
  'Withdrawn',
]

const decisionOptions = ['selected', 'rejected', 'talent_pool', 'review']
const demoInterviewAnswer =
  'In a recent production incident, I first isolated the failing dependency, coordinated with the on-call team, and shipped a rollback in under 20 minutes. Then I added monitoring and a post-incident checklist to prevent recurrence.'

function scoreBadge(value) {
  const score = Number(value || 0)
  if (score >= 75) {
    return 'text-emerald-700 dark:text-emerald-200'
  }
  if (score >= 50) {
    return 'text-amber-700 dark:text-amber-200'
  }
  return 'text-rose-700 dark:text-rose-200'
}

export default function FullHiringCyclePage() {
  const { sharedCvCacheId } = useSharedCv()

  const [auth, setAuth] = useState(null)
  const [activeRole, setActiveRole] = useState('candidate')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [infoMessage, setInfoMessage] = useState('Use seeded accounts or register a candidate to test full lifecycle.')

  const [loginEmail, setLoginEmail] = useState('candidate@talentai.local')
  const [loginPassword, setLoginPassword] = useState('Candidate123!')

  const [registerName, setRegisterName] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')

  const [vacancies, setVacancies] = useState([])
  const [candidateApps, setCandidateApps] = useState([])
  const [candidateInterviews, setCandidateInterviews] = useState([])
  const [recruiterVacancies, setRecruiterVacancies] = useState([])
  const [recruiterApps, setRecruiterApps] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [adminReport, setAdminReport] = useState(null)
  const [adminUsers, setAdminUsers] = useState([])
  const [adminCompanies, setAdminCompanies] = useState([])
  const [aiModulesReport, setAiModulesReport] = useState(null)
  const [candidateSearch, setCandidateSearch] = useState('')
  const [candidateSkillFilter, setCandidateSkillFilter] = useState('')
  const [candidateWorkTypeFilter, setCandidateWorkTypeFilter] = useState('')
  const [comparisonApplicationIds, setComparisonApplicationIds] = useState('')
  const [comparisonResult, setComparisonResult] = useState(null)

  const [vacancyIdToApply, setVacancyIdToApply] = useState('')
  const [candidateCvFile, setCandidateCvFile] = useState(null)
  const [candidateMeta, setCandidateMeta] = useState('{"role_title":"Software Engineer","department":"Engineering"}')

  const [newVacancy, setNewVacancy] = useState({
    title: 'Software Engineer',
    department: 'Engineering',
    salary_min: '120000',
    salary_max: '200000',
    required_skills: 'Java, Spring Boot, MySQL',
    experience_level: '2+ years',
    responsibilities: 'Build APIs and maintain backend systems',
    deadline: '',
    work_type: 'hybrid',
    location: 'Colombo',
  })

  const [statusUpdate, setStatusUpdate] = useState({
    application_id: '',
    status: 'Under Review',
    note: 'Reviewed by recruiter',
  })

  const [interviewSchedule, setInterviewSchedule] = useState({
    application_id: '',
    interview_type: 'text',
    scheduled_at: '',
    question_text: 'Describe a time you solved a production issue under pressure.',
  })

  const [interviewSubmit, setInterviewSubmit] = useState({
    interview_id: '',
    answer_text: '',
  })

  const [decisionInput, setDecisionInput] = useState({
    application_id: '',
    decision: 'review',
    note: 'Awaiting final panel review',
  })

  const [companyInput, setCompanyInput] = useState({
    name: 'Talent AI Labs',
    industry: 'Technology',
    location: 'Colombo',
  })

  const [adminCreateUser, setAdminCreateUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'recruiter',
  })
  const [userAccessInput, setUserAccessInput] = useState({
    user_id: '',
    active: false,
    reason: 'Access control action by admin',
  })

  const authToken = auth?.token || ''
  const currentUser = auth?.user || null

  const authHeaders = useMemo(() => {
    if (!authToken) {
      return {}
    }
    return {
      Authorization: `Bearer ${authToken}`,
    }
  }, [authToken])

  function futureDate(daysAhead = 30) {
    const next = new Date()
    next.setDate(next.getDate() + daysAhead)
    return next.toISOString().slice(0, 10)
  }

  function futureIso(daysAhead = 2, hours = 10) {
    const next = new Date()
    next.setDate(next.getDate() + daysAhead)
    next.setHours(hours, 0, 0, 0)
    return next.toISOString()
  }

  function fillCandidateDemoData() {
    setLoginEmail('candidate@talentai.local')
    setLoginPassword('Candidate123!')
    setRegisterName('Demo Candidate')
    setRegisterEmail('demo.candidate@example.com')
    setRegisterPassword('DemoCandidate123!')
    setVacancyIdToApply('VAC-00001')
    setCandidateMeta(
      '{"role_title":"Backend Engineer","department":"Engineering","experience_years":3,"salary_expectation":180000}',
    )
    setInterviewSubmit((prev) => ({
      ...prev,
      interview_id: prev.interview_id || 'INT-00001',
      answer_text: demoInterviewAnswer,
    }))
  }

  function fillRecruiterDemoData() {
    setLoginEmail('hr@talentai.local')
    setLoginPassword('Recruiter123!')
    setNewVacancy({
      title: 'Backend Engineer',
      department: 'Engineering',
      salary_min: '180000',
      salary_max: '260000',
      required_skills: 'Python, FastAPI, PostgreSQL, Docker',
      experience_level: '3+ years',
      responsibilities: 'Design APIs, improve service reliability, mentor junior engineers',
      deadline: futureDate(21),
      work_type: 'hybrid',
      location: 'Colombo',
    })
    setStatusUpdate({
      application_id: 'APP-00001',
      status: 'Shortlisted',
      note: 'Strong profile based on AI fit score and required skills match',
    })
    setInterviewSchedule({
      application_id: 'APP-00001',
      interview_type: 'text',
      scheduled_at: futureIso(2, 10),
      question_text: 'Describe how you handled a critical production issue from detection to resolution.',
    })
    setDecisionInput({
      application_id: 'APP-00001',
      decision: 'review',
      note: 'Awaiting interview panel feedback before final decision',
    })
  }

  function fillAdminDemoData() {
    setLoginEmail('admin@talentai.local')
    setLoginPassword('Admin123!')
    setCompanyInput({
      name: 'IntelliHire Labs',
      industry: 'AI Software',
      location: 'Colombo',
    })
    setAdminCreateUser({
      name: 'Demo Recruiter',
      email: 'demo.recruiter@example.com',
      password: 'RecruiterDemo123!',
      role: 'recruiter',
    })
    setUserAccessInput({
      user_id: 'USR-00003',
      active: false,
      reason: 'Demo: temporarily disable candidate account',
    })
  }

  function fillActiveRoleDemoData() {
    if (activeRole === 'candidate') {
      fillCandidateDemoData()
      setInfoMessage('Candidate demo data filled. Upload a CV file or use Shared CV cache before applying.')
      return
    }

    if (activeRole === 'recruiter') {
      fillRecruiterDemoData()
      setInfoMessage('Recruiter demo data filled. Use refresh buttons to load live vacancy/application data.')
      return
    }

    fillAdminDemoData()
    setInfoMessage('Admin demo data filled. Use refresh to sync current users/companies/reports.')
  }

  function fillAllRoleDemoData() {
    fillCandidateDemoData()
    fillRecruiterDemoData()
    fillAdminDemoData()
    setInfoMessage('All demo forms were pre-filled for candidate, recruiter, and admin flows.')
  }

  async function request(path, { method = 'GET', body, useFormData = false } = {}) {
    const headers = { ...authHeaders }

    const options = { method, headers }

    if (body !== undefined && body !== null) {
      if (useFormData) {
        options.body = body
      } else {
        headers['Content-Type'] = 'application/json'
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
      throw new Error(message)
    }

    return payload
  }

  async function withLoading(action, successMessage) {
    setLoading(true)
    setErrorMessage('')
    try {
      const result = await action()
      if (successMessage) {
        setInfoMessage(successMessage)
      }
      return result
    } catch (error) {
      setErrorMessage(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  async function handleLogin(email = loginEmail, password = loginPassword) {
    await withLoading(async () => {
      const payload = await request('/api/v1/auth/login', {
        method: 'POST',
        body: { email, password },
      })
      setAuth(payload)
      setActiveRole(payload?.user?.role || 'candidate')
      setInfoMessage(`Logged in as ${payload?.user?.role} (${payload?.user?.email})`)
    })
  }

  async function handleRegisterCandidate(event) {
    event.preventDefault()
    await withLoading(async () => {
      await request('/api/v1/auth/register', {
        method: 'POST',
        body: {
          name: registerName,
          email: registerEmail,
          password: registerPassword,
          role: 'candidate',
        },
      })
      setRegisterName('')
      setRegisterEmail('')
      setRegisterPassword('')
    }, 'Candidate account created. You can login now.')
  }

  async function loadVacancies() {
    await withLoading(async () => {
      const params = new URLSearchParams()
      if (candidateSearch.trim()) {
        params.set('q', candidateSearch.trim())
      }
      if (candidateSkillFilter.trim()) {
        params.set('skill', candidateSkillFilter.trim())
      }
      if (candidateWorkTypeFilter.trim()) {
        params.set('work_type', candidateWorkTypeFilter.trim())
      }
      const suffix = params.toString() ? `?${params.toString()}` : ''
      const data = await request(`/api/v1/vacancies${suffix}`)
      setVacancies(Array.isArray(data) ? data : [])
    }, 'Vacancies refreshed.')
  }

  async function applyToVacancy(event) {
    event.preventDefault()

    await withLoading(async () => {
      if (!vacancyIdToApply.trim()) {
        throw new Error('Vacancy ID is required')
      }

      const formData = new FormData()
      if (candidateCvFile instanceof File) {
        formData.append('cv_file', candidateCvFile)
      } else if (sharedCvCacheId) {
        formData.append('cv_cache_id', sharedCvCacheId)
      } else {
        throw new Error('Upload CV on this page or via Shared CV sidebar first')
      }

      if (candidateMeta.trim()) {
        formData.append('candidate_meta', candidateMeta)
      }

      await request(`/api/v1/vacancies/${vacancyIdToApply.trim()}/apply`, {
        method: 'POST',
        body: formData,
        useFormData: true,
      })

      await loadCandidateApplications(false)
    }, 'Application submitted successfully.')
  }

  async function loadCandidateApplications(showMessage = true) {
    await withLoading(async () => {
      const data = await request('/api/v1/candidates/applications')
      setCandidateApps(Array.isArray(data) ? data : [])
    }, showMessage ? 'Candidate applications refreshed.' : undefined)
  }

  async function loadCandidateInterviews(applicationId) {
    await withLoading(async () => {
      if (!applicationId.trim()) {
        throw new Error('Application ID is required to fetch interviews')
      }
      const data = await request(`/api/v1/applications/${applicationId.trim()}/interviews`)
      setCandidateInterviews(Array.isArray(data) ? data : [])
    }, 'Interview list refreshed.')
  }

  async function submitInterviewAnswer(event) {
    event.preventDefault()

    await withLoading(async () => {
      if (!interviewSubmit.interview_id.trim()) {
        throw new Error('Interview ID is required')
      }
      if (!interviewSubmit.answer_text.trim()) {
        throw new Error('Answer text is required')
      }

      await request(`/api/v1/interviews/${interviewSubmit.interview_id.trim()}/submit`, {
        method: 'POST',
        body: {
          answer_text: interviewSubmit.answer_text,
        },
      })

      setInterviewSubmit((prev) => ({ ...prev, answer_text: '' }))
    }, 'Interview answer submitted and evaluated.')
  }

  async function createVacancy(event) {
    event.preventDefault()

    await withLoading(async () => {
      const payload = {
        ...newVacancy,
        salary_min: newVacancy.salary_min ? Number(newVacancy.salary_min) : null,
        salary_max: newVacancy.salary_max ? Number(newVacancy.salary_max) : null,
        required_skills: newVacancy.required_skills
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      }

      await request('/api/v1/vacancies', {
        method: 'POST',
        body: payload,
      })

      await loadRecruiterVacancies(false)
    }, 'Vacancy created.')
  }

  async function loadRecruiterVacancies(showMessage = true) {
    await withLoading(async () => {
      const data = await request('/api/v1/recruiter/vacancies')
      setRecruiterVacancies(Array.isArray(data) ? data : [])
    }, showMessage ? 'Recruiter vacancies refreshed.' : undefined)
  }

  async function loadRecruiterApplications(vacancyId = '') {
    await withLoading(async () => {
      const query = vacancyId.trim() ? `?vacancy_id=${encodeURIComponent(vacancyId.trim())}` : ''
      const data = await request(`/api/v1/recruiter/applications${query}`)
      setRecruiterApps(Array.isArray(data) ? data : [])
    }, 'Recruiter applications refreshed.')
  }

  async function compareCandidatesForRecruiter() {
    await withLoading(async () => {
      const params = new URLSearchParams()
      if (comparisonApplicationIds.trim()) {
        params.set('application_ids', comparisonApplicationIds.trim())
      }
      const query = params.toString() ? `?${params.toString()}` : ''
      const data = await request(`/api/v1/recruiter/candidates/compare${query}`)
      setComparisonResult(data || null)
    }, 'Candidate comparison refreshed.')
  }

  async function updateStatus(event) {
    event.preventDefault()

    await withLoading(async () => {
      await request(`/api/v1/applications/${statusUpdate.application_id.trim()}/status`, {
        method: 'PATCH',
        body: {
          status: statusUpdate.status,
          note: statusUpdate.note,
        },
      })
      await loadRecruiterApplications()
    }, 'Application status updated.')
  }

  async function scheduleInterview(event) {
    event.preventDefault()

    await withLoading(async () => {
      await request(`/api/v1/applications/${interviewSchedule.application_id.trim()}/interviews`, {
        method: 'POST',
        body: interviewSchedule,
      })
      await loadRecruiterApplications()
    }, 'Interview scheduled.')
  }

  async function finalizeDecision(event) {
    event.preventDefault()

    await withLoading(async () => {
      await request(`/api/v1/applications/${decisionInput.application_id.trim()}/decision`, {
        method: 'POST',
        body: {
          decision: decisionInput.decision,
          note: decisionInput.note,
        },
      })
      await loadRecruiterApplications()
      await loadRecruiterDashboard(false)
    }, 'Final decision saved.')
  }

  async function loadRecruiterDashboard(showMessage = true) {
    await withLoading(async () => {
      const data = await request('/api/v1/recruiter/dashboard')
      setDashboard(data || null)
    }, showMessage ? 'Dashboard refreshed.' : undefined)
  }

  async function createCompany(event) {
    event.preventDefault()

    await withLoading(async () => {
      await request('/api/v1/admin/companies', {
        method: 'POST',
        body: companyInput,
      })
      await loadAdminData(false)
    }, 'Company created.')
  }

  async function createUserAsAdmin(event) {
    event.preventDefault()

    await withLoading(async () => {
      await request('/api/v1/auth/register', {
        method: 'POST',
        body: adminCreateUser,
      })
      setAdminCreateUser({ name: '', email: '', password: '', role: 'recruiter' })
      await loadAdminData(false)
    }, 'User created by admin.')
  }

  async function loadAdminData(showMessage = true) {
    await withLoading(async () => {
      const [users, companies, report, aiModules] = await Promise.all([
        request('/api/v1/admin/users'),
        request('/api/v1/admin/companies'),
        request('/api/v1/admin/reports'),
        request('/api/v1/admin/ai-modules'),
      ])

      setAdminUsers(Array.isArray(users) ? users : [])
      setAdminCompanies(Array.isArray(companies) ? companies : [])
      setAdminReport(report || null)
      setAiModulesReport(aiModules || null)
    }, showMessage ? 'Admin data refreshed.' : undefined)
  }

  async function updateUserAccess(event) {
    event.preventDefault()

    await withLoading(async () => {
      if (!userAccessInput.user_id.trim()) {
        throw new Error('User ID is required for access control')
      }

      await request(`/api/v1/admin/users/${userAccessInput.user_id.trim()}/access`, {
        method: 'PATCH',
        body: {
          active: userAccessInput.active,
          reason: userAccessInput.reason,
        },
      })

      await loadAdminData(false)
    }, 'User access state updated.')
  }

  function logout() {
    setAuth(null)
    setErrorMessage('')
    setComparisonResult(null)
    setAiModulesReport(null)
    setInfoMessage('Logged out.')
  }

  return (
    <ModulePageLayout
      title="Full Hiring Cycle Workspace"
      description="Run the complete end-to-end process: vacancy -> apply -> shortlist -> interview -> risk + final decision -> reporting."
      icon={Workflow}
      tone="blue"
    >
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        <motion.section variants={fadeInUp} className="surface-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Authentication & Role Context</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-white/70">
                Seeded credentials are available for demo testing the full pipeline.
              </p>
            </div>

            {currentUser ? (
              <button
                type="button"
                onClick={logout}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 dark:border-white/10 dark:bg-slate-900 dark:text-white/85 dark:hover:border-cyan-300/35 dark:hover:text-cyan-100"
              >
                Logout
              </button>
            ) : null}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <form
              className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900"
              onSubmit={async (event) => {
                event.preventDefault()
                await handleLogin()
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-white/60">Login</p>
              <label className="mt-3 block text-sm font-medium text-slate-700 dark:text-white/85">
                Email
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(event) => setLoginEmail(event.target.value)}
                  className={fieldBaseClass}
                />
              </label>
              <label className="mt-3 block text-sm font-medium text-slate-700 dark:text-white/85">
                Password
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  className={fieldBaseClass}
                />
              </label>

              <div className="mt-3 flex flex-wrap gap-2">
                {seededAccounts.map((account) => (
                  <button
                    key={account.label}
                    type="button"
                    onClick={() => {
                      setLoginEmail(account.email)
                      setLoginPassword(account.password)
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 dark:border-white/10 dark:bg-slate-950 dark:text-white/80 dark:hover:border-cyan-300/35 dark:hover:text-cyan-100"
                  >
                    {account.label}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                className="mt-4 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-2 text-sm font-semibold text-white"
              >
                Login
              </button>
            </form>

            <form
              className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900"
              onSubmit={handleRegisterCandidate}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-white/60">Candidate Registration</p>
              <label className="mt-3 block text-sm font-medium text-slate-700 dark:text-white/85">
                Name
                <input
                  type="text"
                  value={registerName}
                  onChange={(event) => setRegisterName(event.target.value)}
                  className={fieldBaseClass}
                />
              </label>
              <label className="mt-3 block text-sm font-medium text-slate-700 dark:text-white/85">
                Email
                <input
                  type="email"
                  value={registerEmail}
                  onChange={(event) => setRegisterEmail(event.target.value)}
                  className={fieldBaseClass}
                />
              </label>
              <label className="mt-3 block text-sm font-medium text-slate-700 dark:text-white/85">
                Password
                <input
                  type="password"
                  value={registerPassword}
                  onChange={(event) => setRegisterPassword(event.target.value)}
                  className={fieldBaseClass}
                />
              </label>
              <button
                type="submit"
                className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-cyan-300 hover:text-cyan-700 dark:border-white/10 dark:bg-slate-950 dark:text-white/90"
              >
                Register Candidate
              </button>
            </form>
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-white/10 dark:bg-slate-950/70">
            <p className="font-semibold text-slate-900 dark:text-white">
              Logged in: {currentUser ? `${currentUser.name} (${currentUser.role})` : 'not logged in'}
            </p>
            {infoMessage ? <p className="mt-1 text-slate-600 dark:text-white/70">{infoMessage}</p> : null}
            {errorMessage ? <p className="mt-1 text-rose-600 dark:text-rose-300">{errorMessage}</p> : null}
            {loading ? (
              <p className="mt-1 inline-flex items-center gap-2 text-cyan-700 dark:text-cyan-200">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Processing...
              </p>
            ) : null}
          </div>
        </motion.section>

        <motion.section variants={fadeInUp} className="surface-card p-5">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'candidate', label: 'Candidate', Icon: UserRound },
              { id: 'recruiter', label: 'Recruiter', Icon: BriefcaseBusiness },
              { id: 'admin', label: 'Admin', Icon: ShieldCheck },
            ].map((roleTab) => (
              <button
                key={roleTab.id}
                type="button"
                onClick={() => setActiveRole(roleTab.id)}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                  activeRole === roleTab.id
                    ? 'border-cyan-300 bg-cyan-50 text-cyan-700 dark:border-cyan-300/35 dark:bg-cyan-400/10 dark:text-cyan-100'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-cyan-300 hover:text-cyan-700 dark:border-white/10 dark:bg-slate-900 dark:text-white/80 dark:hover:border-cyan-300/35 dark:hover:text-cyan-100'
                }`}
              >
                <roleTab.Icon className="h-4 w-4" />
                {roleTab.label}
              </button>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={fillActiveRoleDemoData}
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-3 py-2 text-xs font-semibold text-white shadow-[0_8px_18px_rgba(6,182,212,0.26)]"
            >
              Fill Demo Data ({activeRole})
            </button>
            <button
              type="button"
              onClick={fillAllRoleDemoData}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 dark:border-white/10 dark:bg-slate-900 dark:text-white/80 dark:hover:border-cyan-300/35 dark:hover:text-cyan-100"
            >
              Fill All Forms
            </button>
            <p className="text-xs text-slate-500 dark:text-white/60">
              File inputs cannot be auto-filled by browser security. Upload CV manually or use shared cache.
            </p>
          </div>

          {activeRole === 'candidate' ? (
            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">1. Browse Vacancies</p>
                    <button
                      type="button"
                      onClick={loadVacancies}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 dark:border-white/10 dark:bg-slate-950 dark:text-white/80"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Refresh
                    </button>
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <label className="text-xs font-medium text-slate-700 dark:text-white/85">
                      Search
                      <input
                        type="text"
                        value={candidateSearch}
                        onChange={(event) => setCandidateSearch(event.target.value)}
                        className={fieldBaseClass}
                        placeholder="Title, skill, location"
                      />
                    </label>
                    <label className="text-xs font-medium text-slate-700 dark:text-white/85">
                      Skill Filter
                      <input
                        type="text"
                        value={candidateSkillFilter}
                        onChange={(event) => setCandidateSkillFilter(event.target.value)}
                        className={fieldBaseClass}
                        placeholder="e.g. Spring Boot"
                      />
                    </label>
                    <label className="text-xs font-medium text-slate-700 dark:text-white/85">
                      Work Type
                      <select
                        value={candidateWorkTypeFilter}
                        onChange={(event) => setCandidateWorkTypeFilter(event.target.value)}
                        className={fieldBaseClass}
                      >
                        <option value="">Any</option>
                        <option value="onsite">onsite</option>
                        <option value="hybrid">hybrid</option>
                        <option value="remote">remote</option>
                      </select>
                    </label>
                  </div>

                  <div className="mt-3 max-h-56 overflow-auto rounded-lg border border-slate-200 bg-white p-3 text-xs dark:border-white/10 dark:bg-slate-950/70">
                    {vacancies.length === 0 ? (
                      <p className="text-slate-500 dark:text-white/60">No vacancies loaded.</p>
                    ) : (
                      <div className="space-y-2">
                        {vacancies.map((vacancy) => (
                          <button
                            key={vacancy.vacancy_id}
                            type="button"
                            onClick={() => setVacancyIdToApply(vacancy.vacancy_id)}
                            className="block w-full rounded-lg border border-slate-200 bg-white p-2 text-left transition hover:border-cyan-300 dark:border-white/10 dark:bg-slate-900"
                          >
                            <p className="font-semibold text-slate-900 dark:text-white">{vacancy.vacancy_id} - {vacancy.title}</p>
                            <p className="text-slate-600 dark:text-white/65">
                              {vacancy.department} | {vacancy.work_type} | {vacancy.location || 'N/A'}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <form className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900" onSubmit={applyToVacancy}>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">2. Apply to Vacancy</p>
                  <label className="mt-3 block text-sm font-medium text-slate-700 dark:text-white/85">
                    Vacancy ID
                    <input
                      type="text"
                      value={vacancyIdToApply}
                      onChange={(event) => setVacancyIdToApply(event.target.value)}
                      className={fieldBaseClass}
                      placeholder="VAC-00001"
                    />
                  </label>

                  <label className="mt-3 block text-sm font-medium text-slate-700 dark:text-white/85">
                    CV Upload (optional if Shared CV cache exists)
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt"
                      className={`${fieldBaseClass} file:mr-3 file:rounded-lg file:border-0 file:bg-gradient-to-r file:from-cyan-500 file:to-emerald-500 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white dark:file:from-cyan-400 dark:file:to-emerald-400`}
                      onChange={(event) => setCandidateCvFile(event.target.files?.[0] || null)}
                    />
                  </label>

                  <label className="mt-3 block text-sm font-medium text-slate-700 dark:text-white/85">
                    Candidate Meta JSON (optional)
                    <textarea
                      rows={4}
                      value={candidateMeta}
                      onChange={(event) => setCandidateMeta(event.target.value)}
                      className={fieldBaseClass}
                    />
                  </label>

                  <p className="mt-1 text-xs text-slate-500 dark:text-white/60">
                    Shared CV cache: {sharedCvCacheId ? sharedCvCacheId.slice(0, 8) : 'not available'}
                  </p>

                  <button
                    type="submit"
                    className="mt-4 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Submit Application
                  </button>
                </form>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">3. Track My Applications</p>
                    <button
                      type="button"
                      onClick={() => loadCandidateApplications(true)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 dark:border-white/10 dark:bg-slate-950 dark:text-white/80"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Refresh
                    </button>
                  </div>

                  <div className="mt-3 max-h-64 overflow-auto rounded-lg border border-slate-200 bg-white p-3 text-xs dark:border-white/10 dark:bg-slate-950/70">
                    {candidateApps.length === 0 ? (
                      <p className="text-slate-500 dark:text-white/60">No applications yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {candidateApps.map((app) => {
                          const matchScore = app?.ai_scores?.matching?.score_0_100
                          const riskBand = app?.ai_scores?.risk?.risk_band
                          const recommendation = app?.ai_scores?.ai_recommendation

                          return (
                            <button
                              key={app.application_id}
                              type="button"
                              onClick={() => loadCandidateInterviews(app.application_id)}
                              className="block w-full rounded-lg border border-slate-200 bg-white p-2 text-left transition hover:border-cyan-300 dark:border-white/10 dark:bg-slate-900"
                            >
                              <p className="font-semibold text-slate-900 dark:text-white">{app.application_id} - {app.status}</p>
                              <p className="text-slate-600 dark:text-white/65">
                                Vacancy: {app.vacancy_id} | Match: <span className={scoreBadge(matchScore)}>{Number(matchScore || 0).toFixed(1)}</span> | Risk: {riskBand || 'N/A'}
                              </p>
                              <p className="text-slate-500 dark:text-white/60">
                                AI Recommendation: {recommendation || 'Pending evaluation'}
                              </p>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">4. Interviews</p>
                  <div className="mt-3 max-h-44 overflow-auto rounded-lg border border-slate-200 bg-white p-3 text-xs dark:border-white/10 dark:bg-slate-950/70">
                    {candidateInterviews.length === 0 ? (
                      <p className="text-slate-500 dark:text-white/60">Select an application to view interviews.</p>
                    ) : (
                      <div className="space-y-2">
                        {candidateInterviews.map((interview) => (
                          <button
                            key={interview.interview_id}
                            type="button"
                            onClick={() => setInterviewSubmit((prev) => ({ ...prev, interview_id: interview.interview_id }))}
                            className="block w-full rounded-lg border border-slate-200 bg-white p-2 text-left transition hover:border-cyan-300 dark:border-white/10 dark:bg-slate-900"
                          >
                            <p className="font-semibold text-slate-900 dark:text-white">{interview.interview_id} ({interview.interview_type})</p>
                            <p className="text-slate-600 dark:text-white/65">Scheduled: {interview.scheduled_at} | Status: {interview.status}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <form className="mt-3" onSubmit={submitInterviewAnswer}>
                    <label className="block text-sm font-medium text-slate-700 dark:text-white/85">
                      Interview ID
                      <input
                        type="text"
                        value={interviewSubmit.interview_id}
                        onChange={(event) => setInterviewSubmit((prev) => ({ ...prev, interview_id: event.target.value }))}
                        className={fieldBaseClass}
                      />
                    </label>
                    <label className="mt-3 block text-sm font-medium text-slate-700 dark:text-white/85">
                      Answer Text
                      <textarea
                        rows={4}
                        value={interviewSubmit.answer_text}
                        onChange={(event) => setInterviewSubmit((prev) => ({ ...prev, answer_text: event.target.value }))}
                        className={fieldBaseClass}
                      />
                    </label>
                    <button
                      type="submit"
                      className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-cyan-300 hover:text-cyan-700 dark:border-white/10 dark:bg-slate-950 dark:text-white/90"
                    >
                      Submit Interview Answer
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ) : null}

          {activeRole === 'recruiter' ? (
            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <div className="space-y-4">
                <form className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900" onSubmit={createVacancy}>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">1. Create Vacancy</p>

                  {[
                    ['title', 'Job Title'],
                    ['department', 'Department'],
                    ['salary_min', 'Salary Min'],
                    ['salary_max', 'Salary Max'],
                    ['required_skills', 'Required Skills (comma-separated)'],
                    ['experience_level', 'Experience Level'],
                    ['responsibilities', 'Responsibilities'],
                    ['deadline', 'Deadline (YYYY-MM-DD)'],
                    ['location', 'Location'],
                  ].map(([key, label]) => (
                    <label key={key} className="mt-3 block text-sm font-medium text-slate-700 dark:text-white/85">
                      {label}
                      <input
                        type="text"
                        value={newVacancy[key]}
                        onChange={(event) => setNewVacancy((prev) => ({ ...prev, [key]: event.target.value }))}
                        className={fieldBaseClass}
                      />
                    </label>
                  ))}

                  <label className="mt-3 block text-sm font-medium text-slate-700 dark:text-white/85">
                    Work Type
                    <select
                      value={newVacancy.work_type}
                      onChange={(event) => setNewVacancy((prev) => ({ ...prev, work_type: event.target.value }))}
                      className={fieldBaseClass}
                    >
                      <option value="onsite">onsite</option>
                      <option value="hybrid">hybrid</option>
                      <option value="remote">remote</option>
                    </select>
                  </label>

                  <button
                    type="submit"
                    className="mt-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Create Vacancy
                  </button>
                </form>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">2. My Vacancies</p>
                    <button
                      type="button"
                      onClick={() => loadRecruiterVacancies(true)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 dark:border-white/10 dark:bg-slate-950 dark:text-white/80"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Refresh
                    </button>
                  </div>

                  <div className="mt-3 max-h-52 overflow-auto rounded-lg border border-slate-200 bg-white p-3 text-xs dark:border-white/10 dark:bg-slate-950/70">
                    {recruiterVacancies.length === 0 ? (
                      <p className="text-slate-500 dark:text-white/60">No recruiter vacancies found.</p>
                    ) : (
                      <div className="space-y-2">
                        {recruiterVacancies.map((vacancy) => (
                          <button
                            key={vacancy.vacancy_id}
                            type="button"
                            onClick={() => loadRecruiterApplications(vacancy.vacancy_id)}
                            className="block w-full rounded-lg border border-slate-200 bg-white p-2 text-left transition hover:border-cyan-300 dark:border-white/10 dark:bg-slate-900"
                          >
                            <p className="font-semibold text-slate-900 dark:text-white">{vacancy.vacancy_id} - {vacancy.title}</p>
                            <p className="text-slate-600 dark:text-white/65">{vacancy.department} | {vacancy.status}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">3. Applicant Pipeline</p>
                    <button
                      type="button"
                      onClick={() => loadRecruiterApplications('')}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 dark:border-white/10 dark:bg-slate-950 dark:text-white/80"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Refresh
                    </button>
                  </div>

                  <div className="mt-3 max-h-56 overflow-auto rounded-lg border border-slate-200 bg-white p-3 text-xs dark:border-white/10 dark:bg-slate-950/70">
                    {recruiterApps.length === 0 ? (
                      <p className="text-slate-500 dark:text-white/60">No applications found.</p>
                    ) : (
                      <div className="space-y-2">
                        {recruiterApps.map((app) => {
                          const fitScore = app?.ai_scores?.fit_score_0_100
                          const interviewScore = app?.ai_scores?.interview?.overall_score_0_100
                          const recommendation = app?.ai_scores?.ai_recommendation
                          const riskBand = app?.ai_scores?.risk?.risk_band

                          return (
                            <button
                              key={app.application_id}
                              type="button"
                              onClick={() => {
                                setStatusUpdate((prev) => ({ ...prev, application_id: app.application_id }))
                                setInterviewSchedule((prev) => ({ ...prev, application_id: app.application_id }))
                                setDecisionInput((prev) => ({ ...prev, application_id: app.application_id }))
                                setComparisonApplicationIds((prev) => {
                                  if (!prev.trim()) {
                                    return app.application_id
                                  }
                                  const existing = prev
                                    .split(',')
                                    .map((item) => item.trim())
                                    .filter(Boolean)
                                  if (existing.includes(app.application_id)) {
                                    return prev
                                  }
                                  return `${prev}, ${app.application_id}`
                                })
                              }}
                              className="block w-full rounded-lg border border-slate-200 bg-white p-2 text-left transition hover:border-cyan-300 dark:border-white/10 dark:bg-slate-900"
                            >
                              <p className="font-semibold text-slate-900 dark:text-white">
                                {app.application_id} - {app.candidate_name || app.candidate_email}
                              </p>
                              <p className="text-slate-600 dark:text-white/65">
                                Status: {app.status} | Fit: <span className={scoreBadge(fitScore)}>{Number(fitScore || 0).toFixed(1)}</span> | Interview: {Number(interviewScore || 0).toFixed(1)} | Risk: {riskBand || 'N/A'}
                              </p>
                              <p className="text-slate-500 dark:text-white/60">
                                AI Recommendation: {recommendation || 'Pending evaluation'}
                              </p>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">4. Compare Candidates + AI Recommendation</p>
                    <button
                      type="button"
                      onClick={compareCandidatesForRecruiter}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 dark:border-white/10 dark:bg-slate-950 dark:text-white/80"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Compare
                    </button>
                  </div>
                  <label className="mt-3 block text-sm font-medium text-slate-700 dark:text-white/85">
                    Application IDs (comma-separated)
                    <input
                      type="text"
                      value={comparisonApplicationIds}
                      onChange={(event) => setComparisonApplicationIds(event.target.value)}
                      className={fieldBaseClass}
                      placeholder="APP-00001, APP-00002"
                    />
                  </label>

                  <div className="mt-3 max-h-56 overflow-auto rounded-lg border border-slate-200 bg-white p-3 text-xs dark:border-white/10 dark:bg-slate-950/70">
                    {comparisonResult?.comparison_rows?.length ? (
                      <div className="space-y-2">
                        {comparisonResult.comparison_rows.map((row) => (
                          <div key={row.application_id} className="rounded-lg border border-slate-200 bg-white p-2 dark:border-white/10 dark:bg-slate-900">
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {row.application_id} - {row.candidate_name}
                            </p>
                            <p className="text-slate-600 dark:text-white/65">
                              Final: <span className={scoreBadge(row.final_score_0_100)}>{Number(row.final_score_0_100 || 0).toFixed(1)}</span>
                              {' '}| Fit: {Number(row.fit_score_0_100 || 0).toFixed(1)}
                              {' '}| Interview: {Number(row.interview_score_0_100 || 0).toFixed(1)}
                              {' '}| Risk: {row.risk_band}
                            </p>
                            <p className="text-slate-500 dark:text-white/60">
                              {row.recommendation}: {row.recommendation_reason}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 dark:text-white/60">Run compare to see ranked candidates and recommendations.</p>
                    )}
                  </div>
                </div>

                <form className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900" onSubmit={updateStatus}>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">5. Update Application Status</p>
                  <label className="mt-3 block text-sm font-medium text-slate-700 dark:text-white/85">
                    Application ID
                    <input
                      type="text"
                      value={statusUpdate.application_id}
                      onChange={(event) => setStatusUpdate((prev) => ({ ...prev, application_id: event.target.value }))}
                      className={fieldBaseClass}
                    />
                  </label>
                  <label className="mt-3 block text-sm font-medium text-slate-700 dark:text-white/85">
                    Status
                    <select
                      value={statusUpdate.status}
                      onChange={(event) => setStatusUpdate((prev) => ({ ...prev, status: event.target.value }))}
                      className={fieldBaseClass}
                    >
                      {applicationStatuses.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </label>
                  <label className="mt-3 block text-sm font-medium text-slate-700 dark:text-white/85">
                    Note
                    <input
                      type="text"
                      value={statusUpdate.note}
                      onChange={(event) => setStatusUpdate((prev) => ({ ...prev, note: event.target.value }))}
                      className={fieldBaseClass}
                    />
                  </label>
                  <button type="submit" className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 dark:border-white/10 dark:bg-slate-950 dark:text-white/90">
                    Update Status
                  </button>
                </form>

                <form className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900" onSubmit={scheduleInterview}>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">6. Schedule Interview</p>
                  {[
                    ['application_id', 'Application ID'],
                    ['scheduled_at', 'Scheduled At (ISO datetime)'],
                    ['question_text', 'Question Text'],
                  ].map(([key, label]) => (
                    <label key={key} className="mt-3 block text-sm font-medium text-slate-700 dark:text-white/85">
                      {label}
                      <input
                        type="text"
                        value={interviewSchedule[key]}
                        onChange={(event) => setInterviewSchedule((prev) => ({ ...prev, [key]: event.target.value }))}
                        className={fieldBaseClass}
                      />
                    </label>
                  ))}
                  <label className="mt-3 block text-sm font-medium text-slate-700 dark:text-white/85">
                    Interview Type
                    <select
                      value={interviewSchedule.interview_type}
                      onChange={(event) => setInterviewSchedule((prev) => ({ ...prev, interview_type: event.target.value }))}
                      className={fieldBaseClass}
                    >
                      <option value="text">text</option>
                      <option value="mcq">mcq</option>
                      <option value="video">video</option>
                    </select>
                  </label>
                  <button type="submit" className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 dark:border-white/10 dark:bg-slate-950 dark:text-white/90">
                    Schedule Interview
                  </button>
                </form>

                <form className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900" onSubmit={finalizeDecision}>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">7. Final Decision</p>
                  <label className="mt-3 block text-sm font-medium text-slate-700 dark:text-white/85">
                    Application ID
                    <input
                      type="text"
                      value={decisionInput.application_id}
                      onChange={(event) => setDecisionInput((prev) => ({ ...prev, application_id: event.target.value }))}
                      className={fieldBaseClass}
                    />
                  </label>
                  <label className="mt-3 block text-sm font-medium text-slate-700 dark:text-white/85">
                    Decision
                    <select
                      value={decisionInput.decision}
                      onChange={(event) => setDecisionInput((prev) => ({ ...prev, decision: event.target.value }))}
                      className={fieldBaseClass}
                    >
                      {decisionOptions.map((decision) => (
                        <option key={decision} value={decision}>{decision}</option>
                      ))}
                    </select>
                  </label>
                  <label className="mt-3 block text-sm font-medium text-slate-700 dark:text-white/85">
                    Note
                    <input
                      type="text"
                      value={decisionInput.note}
                      onChange={(event) => setDecisionInput((prev) => ({ ...prev, note: event.target.value }))}
                      className={fieldBaseClass}
                    />
                  </label>
                  <button type="submit" className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 dark:border-white/10 dark:bg-slate-950 dark:text-white/90">
                    Save Final Decision
                  </button>
                </form>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">8. Recruiter Dashboard</p>
                    <button
                      type="button"
                      onClick={() => loadRecruiterDashboard(true)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 dark:border-white/10 dark:bg-slate-950 dark:text-white/80"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Refresh
                    </button>
                  </div>

                  <pre className="mt-3 max-h-64 overflow-auto rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700 dark:border-white/10 dark:bg-slate-950/70 dark:text-white/80">
                    {dashboard ? JSON.stringify(dashboard, null, 2) : 'Dashboard not loaded.'}
                  </pre>
                </div>
              </div>
            </div>
          ) : null}

          {activeRole === 'admin' ? (
            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <div className="space-y-4">
                <form className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900" onSubmit={createCompany}>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">1. Create Company</p>
                  {[
                    ['name', 'Company Name'],
                    ['industry', 'Industry'],
                    ['location', 'Location'],
                  ].map(([key, label]) => (
                    <label key={key} className="mt-3 block text-sm font-medium text-slate-700 dark:text-white/85">
                      {label}
                      <input
                        type="text"
                        value={companyInput[key]}
                        onChange={(event) => setCompanyInput((prev) => ({ ...prev, [key]: event.target.value }))}
                        className={fieldBaseClass}
                      />
                    </label>
                  ))}
                  <button type="submit" className="mt-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white">
                    Create Company
                  </button>
                </form>

                <form className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900" onSubmit={createUserAsAdmin}>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">2. Create Recruiter/Admin User</p>
                  {[
                    ['name', 'Name'],
                    ['email', 'Email'],
                    ['password', 'Password'],
                  ].map(([key, label]) => (
                    <label key={key} className="mt-3 block text-sm font-medium text-slate-700 dark:text-white/85">
                      {label}
                      <input
                        type={key === 'password' ? 'password' : 'text'}
                        value={adminCreateUser[key]}
                        onChange={(event) => setAdminCreateUser((prev) => ({ ...prev, [key]: event.target.value }))}
                        className={fieldBaseClass}
                      />
                    </label>
                  ))}
                  <label className="mt-3 block text-sm font-medium text-slate-700 dark:text-white/85">
                    Role
                    <select
                      value={adminCreateUser.role}
                      onChange={(event) => setAdminCreateUser((prev) => ({ ...prev, role: event.target.value }))}
                      className={fieldBaseClass}
                    >
                      <option value="recruiter">recruiter</option>
                      <option value="admin">admin</option>
                    </select>
                  </label>
                  <button type="submit" className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 dark:border-white/10 dark:bg-slate-950 dark:text-white/90">
                    Create User
                  </button>
                </form>

                <form className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900" onSubmit={updateUserAccess}>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">3. Security & Access Control</p>
                  <label className="mt-3 block text-sm font-medium text-slate-700 dark:text-white/85">
                    Target User ID
                    <input
                      type="text"
                      value={userAccessInput.user_id}
                      onChange={(event) => setUserAccessInput((prev) => ({ ...prev, user_id: event.target.value }))}
                      className={fieldBaseClass}
                      placeholder="USR-00003"
                    />
                  </label>
                  <label className="mt-3 block text-sm font-medium text-slate-700 dark:text-white/85">
                    Access Action
                    <select
                      value={userAccessInput.active ? 'active' : 'disabled'}
                      onChange={(event) => setUserAccessInput((prev) => ({ ...prev, active: event.target.value === 'active' }))}
                      className={fieldBaseClass}
                    >
                      <option value="active">Activate user account</option>
                      <option value="disabled">Disable user account</option>
                    </select>
                  </label>
                  <label className="mt-3 block text-sm font-medium text-slate-700 dark:text-white/85">
                    Reason
                    <input
                      type="text"
                      value={userAccessInput.reason}
                      onChange={(event) => setUserAccessInput((prev) => ({ ...prev, reason: event.target.value }))}
                      className={fieldBaseClass}
                    />
                  </label>
                  <button type="submit" className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 dark:border-white/10 dark:bg-slate-950 dark:text-white/90">
                    Apply Access Update
                  </button>
                </form>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">4. Admin Monitoring</p>
                    <button
                      type="button"
                      onClick={() => loadAdminData(true)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 dark:border-white/10 dark:bg-slate-950 dark:text-white/80"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Refresh
                    </button>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-slate-200 bg-white p-3 text-center dark:border-white/10 dark:bg-slate-950/70">
                      <Building2 className="mx-auto h-4 w-4 text-cyan-600 dark:text-cyan-200" />
                      <p className="mt-1 text-xs text-slate-500 dark:text-white/60">Companies</p>
                      <p className="text-lg font-semibold text-slate-900 dark:text-white">{adminReport?.counts?.companies || 0}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-3 text-center dark:border-white/10 dark:bg-slate-950/70">
                      <Users className="mx-auto h-4 w-4 text-cyan-600 dark:text-cyan-200" />
                      <p className="mt-1 text-xs text-slate-500 dark:text-white/60">Users</p>
                      <p className="text-lg font-semibold text-slate-900 dark:text-white">{adminReport?.counts?.users || 0}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-3 text-center dark:border-white/10 dark:bg-slate-950/70">
                      <ClipboardList className="mx-auto h-4 w-4 text-cyan-600 dark:text-cyan-200" />
                      <p className="mt-1 text-xs text-slate-500 dark:text-white/60">Applications</p>
                      <p className="text-lg font-semibold text-slate-900 dark:text-white">{adminReport?.counts?.applications || 0}</p>
                    </div>
                  </div>

                  <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3 text-xs dark:border-white/10 dark:bg-slate-950/70">
                    <p className="font-semibold text-slate-800 dark:text-white/90">Users by Role</p>
                    <p className="mt-1 text-slate-600 dark:text-white/70">
                      {adminReport?.users_by_role ? JSON.stringify(adminReport.users_by_role) : 'N/A'}
                    </p>
                  </div>

                  <details className="mt-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950/70">
                    <summary className="cursor-pointer text-xs font-semibold text-slate-800 dark:text-white/90">Recent Audit Logs</summary>
                    <pre className="mt-2 max-h-44 overflow-auto text-[11px] text-slate-700 dark:text-white/80">
                      {adminReport?.recent_audit_logs ? JSON.stringify(adminReport.recent_audit_logs, null, 2) : 'N/A'}
                    </pre>
                  </details>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">5. AI Module Monitor</p>
                  <div className="mt-3 space-y-2 rounded-lg border border-slate-200 bg-white p-3 text-xs dark:border-white/10 dark:bg-slate-950/70">
                    {aiModulesReport?.modules?.length ? (
                      aiModulesReport.modules.map((moduleItem) => (
                        <div key={moduleItem.module_key} className="rounded-lg border border-slate-200 bg-white p-2 dark:border-white/10 dark:bg-slate-900">
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {moduleItem.module_name} ({moduleItem.status})
                          </p>
                          <p className="text-slate-600 dark:text-white/65">
                            Model: {moduleItem.model_name} | Source: {moduleItem.model_source}
                          </p>
                          <p className="text-slate-500 dark:text-white/60">
                            Usage: {moduleItem.usage_count} | {moduleItem.notes}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-500 dark:text-white/60">AI module report not loaded.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">6. Data Views</p>
                  <details className="mt-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950/70">
                    <summary className="cursor-pointer text-xs font-semibold text-slate-800 dark:text-white/90">Companies ({adminCompanies.length})</summary>
                    <pre className="mt-2 max-h-40 overflow-auto text-[11px] text-slate-700 dark:text-white/80">
                      {JSON.stringify(adminCompanies, null, 2)}
                    </pre>
                  </details>
                  <details className="mt-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950/70">
                    <summary className="cursor-pointer text-xs font-semibold text-slate-800 dark:text-white/90">Users ({adminUsers.length})</summary>
                    <pre className="mt-2 max-h-40 overflow-auto text-[11px] text-slate-700 dark:text-white/80">
                      {JSON.stringify(adminUsers, null, 2)}
                    </pre>
                  </details>
                </div>
              </div>
            </div>
          ) : null}
        </motion.section>

        <motion.section variants={fadeInUp} className="surface-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-white/60">
            Workflow Coverage
          </p>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            {[
              'Vacancy creation & publication',
              'Candidate job search + application with CV + AI scoring',
              'Shortlisting and status pipeline',
              'Interview scheduling and text-based AI evaluation',
              'Candidate comparison + AI recommendations + final decision',
              'Admin reports, AI module monitoring, and access control',
            ].map((item) => (
              <div key={item} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-white/80">
                <span className="inline-flex items-center gap-1 font-semibold"><ArrowDownUp className="h-3.5 w-3.5" /> {item}</span>
              </div>
            ))}
          </div>
        </motion.section>
      </motion.div>
    </ModulePageLayout>
  )
}
