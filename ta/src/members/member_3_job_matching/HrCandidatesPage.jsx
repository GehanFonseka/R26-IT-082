import { motion } from 'framer-motion'
import { LoaderCircle, Search, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import Header from '../../shared/components/Header'
import { hrStatusClasses, requestWithHrAuth } from '../../shared/utils/hrWorkspaceApi'

const fieldBaseClass =
  'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200/70 dark:border-white/10 dark:bg-slate-900 dark:text-white dark:focus:border-cyan-300 dark:focus:ring-cyan-400/25'

export default function HrCandidatesPage() {
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [applications, setApplications] = useState([])
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  async function loadApplications() {
    setLoading(true)
    setErrorMessage('')
    try {
      const payload = await requestWithHrAuth('/api/v1/recruiter/applications')
      setApplications(Array.isArray(payload) ? payload : [])
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadApplications()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const status = statusFilter.trim().toLowerCase()

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

      if (q && !searchable.includes(q)) {
        return false
      }

      if (status && String(item.status || '').toLowerCase() !== status) {
        return false
      }

      return true
    })
  }, [applications, query, statusFilter])

  return (
    <main className="min-h-screen">
      <Header
        brandText="AI Talent Acquisition"
        tagline="HR Workspace: candidate list"
        navLinks={[]}
      />

      <section className="mx-auto max-w-6xl px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="surface-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="accent-chip">
                <UserRound className="h-3.5 w-3.5" />
                HR Candidates
              </p>
              <h1 className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">Applied Candidate List</h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-white/70">
                Filter and open a dedicated candidate review page for detailed model rechecks and manual status actions.
              </p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={loadApplications} className="btn-secondary">Refresh</button>
              <Link to="/hr/dashboard" className="btn-secondary">Dashboard</Link>
            </div>
          </div>

          {errorMessage ? (
            <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-300/25 dark:bg-rose-400/10 dark:text-rose-200">
              {errorMessage}
            </p>
          ) : null}
        </motion.div>

        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="surface-card mt-4 p-5">
          <div className="grid gap-3 md:grid-cols-3">
            <label className="text-sm font-medium text-slate-700 dark:text-white/85">
              Search
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className={`${fieldBaseClass} pl-9`}
                  placeholder="Candidate, application, vacancy..."
                />
              </div>
            </label>
            <label className="text-sm font-medium text-slate-700 dark:text-white/85">
              Status
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
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
            <div className="self-end rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-white/80">
              Showing {filtered.length} of {applications.length} candidates
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {loading ? (
              <p className="inline-flex items-center gap-2 text-sm text-cyan-700 dark:text-cyan-200">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Loading candidates...
              </p>
            ) : null}

            {!loading && filtered.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-white/60">No candidates found for the current filters.</p>
            ) : null}

            {filtered.map((application) => {
              const classes = hrStatusClasses(application.status)
              return (
                <div key={application.application_id} className={`rounded-xl border px-3 py-3 ${classes.card}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className={`text-sm font-semibold ${classes.title}`}>
                        {application.candidate_name || application.candidate_email}
                      </p>
                      <p className={`mt-1 text-xs ${classes.text}`}>
                        {application.application_id} | Status: {application.status} | Vacancy: {application.vacancy_id}
                      </p>
                      <p className={`mt-1 text-xs ${classes.text}`}>
                        Fit: {Number(application?.ai_scores?.fit_score_0_100 || 0).toFixed(1)} | Risk: {application?.ai_scores?.risk?.risk_band || 'N/A'}
                      </p>
                    </div>
                    <Link to={`/hr/candidates/${application.application_id}`} className="btn-secondary">
                      Open Review
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.section>
      </section>
    </main>
  )
}
