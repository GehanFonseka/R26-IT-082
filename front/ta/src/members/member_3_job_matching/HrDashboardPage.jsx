import { motion } from 'framer-motion'
import { BriefcaseBusiness, CheckCircle2, LoaderCircle, UserRound, XCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import Header from '../../shared/components/Header'
import { requestWithHrAuth } from '../../shared/utils/hrWorkspaceApi'

export default function HrDashboardPage() {
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [applications, setApplications] = useState([])
  const [dashboard, setDashboard] = useState(null)

  async function loadData() {
    setLoading(true)
    setErrorMessage('')
    try {
      const [applicationsPayload, dashboardPayload] = await Promise.all([
        requestWithHrAuth('/api/v1/recruiter/applications'),
        requestWithHrAuth('/api/v1/recruiter/dashboard'),
      ])
      setApplications(Array.isArray(applicationsPayload) ? applicationsPayload : [])
      setDashboard(dashboardPayload || null)
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const summary = useMemo(() => {
    const funnel = dashboard?.funnel || {}
    return {
      total: Number(dashboard?.total_applications || applications.length || 0),
      shortlisted: Number(funnel.Shortlisted || 0),
      selected: Number(funnel.Selected || 0),
      rejected: Number(funnel.Rejected || 0),
    }
  }, [dashboard, applications.length])

  return (
    <main className="min-h-screen">
      <Header
        brandText="AI Talent Acquisition"
        tagline="HR Workspace: multi-page dashboard"
        navLinks={[]}
      />

      <section className="mx-auto max-w-6xl px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="surface-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="accent-chip">
                <UserRound className="h-3.5 w-3.5" />
                HR Dashboard
              </p>
              <h1 className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">Hiring Control Center</h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-white/70">
                Use dedicated pages for candidate list, candidate review, manual model rechecks, and hiring actions.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={loadData} className="btn-secondary">
                Refresh
              </button>
              <Link to="/hr/candidates" className="btn-primary">
                Open Candidates
              </Link>
              <Link to="/hr-post-jobs" className="btn-secondary">
                Post Jobs
              </Link>
              <Link to="/full-hiring-cycle" className="btn-secondary">
                Full Cycle
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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
              <p className="text-xs font-semibold text-slate-500 dark:text-white/60">Total Applications</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{summary.total}</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-300/35 dark:bg-amber-500/10">
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-100">Shortlisted</p>
              <p className="mt-2 text-2xl font-semibold text-amber-900 dark:text-amber-100">{summary.shortlisted}</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-300/35 dark:bg-emerald-500/10">
              <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-100">Selected</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-900 dark:text-emerald-100">{summary.selected}</p>
            </div>
            <div className="rounded-xl border border-rose-300 bg-rose-100 p-4 dark:border-rose-300/45 dark:bg-rose-500/20">
              <p className="text-xs font-semibold text-rose-800 dark:text-rose-100">Rejected</p>
              <p className="mt-2 text-2xl font-semibold text-rose-900 dark:text-rose-100">{summary.rejected}</p>
            </div>
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="surface-card mt-4 p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Recent Candidates</h2>
            <Link to="/hr/candidates" className="btn-secondary">View All</Link>
          </div>

          <div className="mt-3 space-y-2">
            {loading ? (
              <p className="inline-flex items-center gap-2 text-sm text-cyan-700 dark:text-cyan-200">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Loading candidates...
              </p>
            ) : null}

            {!loading && applications.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-white/60">No candidates yet.</p>
            ) : null}

            {applications.slice(0, 8).map((application) => {
              const normalizedStatus = String(application?.status || '').toLowerCase()
              const isRejected = normalizedStatus === 'rejected'
              const isSelected = normalizedStatus === 'selected'

              return (
                <Link
                  key={application.application_id}
                  to={`/hr/candidates/${application.application_id}`}
                  className={`block rounded-xl border px-3 py-2 ${
                    isRejected
                      ? 'border-rose-300 bg-rose-100 dark:border-rose-300/45 dark:bg-rose-500/20'
                      : isSelected
                        ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-300/35 dark:bg-emerald-500/15'
                        : 'border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className={`text-sm font-semibold ${
                        isRejected
                          ? 'text-rose-900 dark:text-rose-100'
                          : isSelected
                            ? 'text-emerald-900 dark:text-emerald-100'
                            : 'text-slate-900 dark:text-white'
                      }`}>
                        {application.candidate_name || application.candidate_email}
                      </p>
                      <p className={`text-xs ${
                        isRejected
                          ? 'text-rose-800 dark:text-rose-100'
                          : isSelected
                            ? 'text-emerald-800 dark:text-emerald-100'
                            : 'text-slate-600 dark:text-white/70'
                      }`}>
                        {application.application_id} | {application.status} | Vacancy: {application.vacancy_id}
                      </p>
                    </div>
                    {isSelected ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-700 dark:text-emerald-200" />
                    ) : isRejected ? (
                      <XCircle className="h-4 w-4 text-rose-700 dark:text-rose-200" />
                    ) : (
                      <BriefcaseBusiness className="h-4 w-4 text-slate-500 dark:text-white/60" />
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </motion.section>
      </section>
    </main>
  )
}
