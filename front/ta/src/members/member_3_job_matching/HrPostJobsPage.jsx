import { motion } from 'framer-motion'
import { BriefcaseBusiness, LoaderCircle, PlusCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import Header from '../../shared/components/Header'
import { useUserMode } from '../../shared/context/UserModeContext'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const DEMO_HR = {
  email: 'hr@talentai.local',
  password: 'Recruiter123!',
}
const HR_TOKEN_KEY = 'talent_demo_hr_token'

const fieldBaseClass =
  'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200/70 dark:border-white/10 dark:bg-slate-900 dark:text-white dark:focus:border-cyan-300 dark:focus:ring-cyan-400/25'

async function request(path, { method = 'GET', body, authToken = '' } = {}) {
  const headers = {}
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`
  }
  if (body) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
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

export default function HrPostJobsPage() {
  const { isHr } = useUserMode()

  const [jobName, setJobName] = useState('')
  const [requiredSkills, setRequiredSkills] = useState('')
  const [jobs, setJobs] = useState([])

  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [infoMessage, setInfoMessage] = useState('Only Job Name and Required Skills are needed to post.')

  async function loadJobs() {
    setLoading(true)
    setErrorMessage('')
    try {
      const payload = await request('/api/v1/public/jobs')
      setJobs(Array.isArray(payload?.jobs) ? payload.jobs : [])
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadJobs()
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()

    if (!isHr) {
      setErrorMessage('Only HR mode can post jobs.')
      return
    }

    if (!jobName.trim()) {
      setErrorMessage('Job Name is required.')
      return
    }

    if (!requiredSkills.trim()) {
      setErrorMessage('Required Skills are required.')
      return
    }

    setSubmitting(true)
    setErrorMessage('')
    try {
      let token = await getHrToken()
      try {
        await request('/api/v1/public/jobs', {
          method: 'POST',
          body: {
            job_name: jobName,
            required_skills: requiredSkills,
          },
          authToken: token,
        })
      } catch (error) {
        if (error?.status !== 401) {
          throw error
        }
        token = await getHrToken(true)
        await request('/api/v1/public/jobs', {
          method: 'POST',
          body: {
            job_name: jobName,
            required_skills: requiredSkills,
          },
          authToken: token,
        })
      }

      setJobName('')
      setRequiredSkills('')
      setInfoMessage('Job posted successfully.')
      await loadJobs()
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[-90px] top-28 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl dark:bg-cyan-400/12" />
        <div className="absolute right-[-90px] top-72 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-400/10" />
      </div>

      <Header
        brandText="AI Talent Acquisition"
        tagline="HR job posting page"
        navLinks={[]}
      />

      <section className="mx-auto max-w-5xl px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="surface-card p-5">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 text-white">
              <BriefcaseBusiness className="h-4.5 w-4.5" />
            </span>
            <div>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white">HR Job Posting</h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-white/70">
                Keep it simple: post jobs with only `Job Name` and `Required Skills`.
              </p>
              <p className="mt-1 text-xs text-slate-600 dark:text-white/70">
                Posting is restricted to HR role. A demo HR session is created automatically.
              </p>
            </div>
          </div>

          {!isHr ? (
            <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-300/25 dark:bg-amber-400/10 dark:text-amber-200">
              You are in Candidate mode. Switch to HR mode from the header toggle to use this page.
            </p>
          ) : null}

          {infoMessage ? <p className="mt-3 text-sm text-slate-600 dark:text-white/70">{infoMessage}</p> : null}
          {errorMessage ? (
            <p className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-300/25 dark:bg-rose-400/10 dark:text-rose-200">
              {errorMessage}
            </p>
          ) : null}

          <form className="mt-4 grid gap-3" onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-slate-700 dark:text-white/85">
              Job Name *
              <input
                type="text"
                value={jobName}
                onChange={(event) => setJobName(event.target.value)}
                className={fieldBaseClass}
                placeholder="Software Engineer"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700 dark:text-white/85">
              Required Skills *
              <input
                type="text"
                value={requiredSkills}
                onChange={(event) => setRequiredSkills(event.target.value)}
                className={fieldBaseClass}
                placeholder="Python, FastAPI, SQL"
              />
            </label>

            <button
              type="submit"
              disabled={submitting || !isHr}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
              Post Job
            </button>
          </form>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="surface-card mt-4 p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Posted Jobs</h2>
            <button
              type="button"
              onClick={loadJobs}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 dark:border-white/10 dark:bg-slate-900 dark:text-white/80"
            >
              Refresh
            </button>
          </div>

          <div className="mt-3 space-y-2">
            {loading ? (
              <p className="inline-flex items-center gap-2 text-sm text-cyan-700 dark:text-cyan-200">
                <LoaderCircle className="h-4 w-4 animate-spin" /> Loading jobs...
              </p>
            ) : null}

            {!loading && jobs.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-white/60">No jobs posted yet.</p>
            ) : null}

            {jobs.map((job) => (
              <div key={job.job_id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-slate-900">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{job.job_name}</p>
                <p className="mt-1 text-xs text-slate-600 dark:text-white/70">Skills: {(job.required_skills || []).join(', ')}</p>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-white/55">Job ID: {job.job_id}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>
    </main>
  )
}
